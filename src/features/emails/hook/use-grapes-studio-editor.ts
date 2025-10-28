import { RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Editor } from 'grapesjs'
import grapesJSMJML from 'grapesjs-mjml'
import { createStudioEditor } from '@grapesjs/studio-sdk'
import studioCss from '@grapesjs/studio-sdk/dist/style.css?inline'
import { Email } from '../data/schema'
import { deleteImage, listImages, uploadImage } from '../api/image'

type AssetOptions = {
  prefix?: string
  useSignedUrl?: boolean
  signedExpires?: number
}

type StudioOptions = AssetOptions & {
  licenseKey?: string
}

const DEFAULT_TEMPLATE = `
  <mjml>
    <mj-head>
      <mj-attributes>
        <mj-class
          name="body-text"
          font-family="Helvetica, Arial, sans-serif"
          font-size="14px"
          line-height="1.6"
          color="#333333"
        />
        <mj-class
          name="primary-button"
          background-color="#6366f1"
          color="#ffffff"
          padding="14px 28px"
          border-radius="6px"
          font-weight="600"
          text-decoration="none"
        />
      </mj-attributes>
    </mj-head>
    <mj-body background-color="#f4f4f5">
      <mj-section background-color="#ffffff" padding="24px">
        <mj-column>
          <mj-text mj-class="body-text">Welcome to your new email.</mj-text>
          <mj-text mj-class="body-text">
            Start editing by replacing this paragraph with your own content. You can add sections,
            images, buttons, and more from the left panel.
          </mj-text>
          <mj-button mj-class="primary-button" href="#">Call to action</mj-button>
        </mj-column>
      </mj-section>
    </mj-body>
  </mjml>
`

export function useGrapesStudioEditor(
  open: boolean,
  containerRef: RefObject<HTMLDivElement | null>,
  currentRow?: Email,
  options: StudioOptions = { prefix: '', useSignedUrl: false, signedExpires: 600 }
) {
  const editorRef = useRef<Editor | null>(null)
  const mountRef = useRef<HTMLDivElement | null>(null)
  const editorReadyRef = useRef(false)
  const lastLoadedMjmlRef = useRef<string | null>(null)
  const dialogOverlayPointerCacheRef = useRef(new Map<HTMLElement, string>())
  const [initError, setInitError] = useState<string | null>(null)

  const { prefix = '', useSignedUrl = false, signedExpires = 600, licenseKey } = useMemo(
    () => ({
      prefix: options?.prefix ?? '',
      useSignedUrl: options?.useSignedUrl ?? false,
      signedExpires: options?.signedExpires ?? 600,
      licenseKey: options?.licenseKey,
    }),
    [options?.prefix, options?.useSignedUrl, options?.signedExpires, options?.licenseKey]
  )

  const scopedStudioCss = useMemo(() => {
    const prefix = '#headlessui-portal-root'
    const scoped = studioCss.replace(
      /(^|})\s*([^@{}][^{]*)\{/g,
      (match, blockStart, selectorGroup) => {
        const start = typeof blockStart === 'string' ? blockStart : ''
        const selectors = (selectorGroup as string)
          .split(',')
          .map((selector) => {
            const trimmed = selector.trim()
            if (!trimmed) return trimmed
            if (trimmed.startsWith(prefix)) return trimmed
            if (trimmed.startsWith(':root')) return prefix
            return `${prefix} ${trimmed}`
          })
          .join(', ')
        return `${start} ${selectors}{`
      }
    )
    return scoped
  }, [])

  useEffect(() => {
    const portalStyleId = 'studio-portal-style'
    if (!document.getElementById(portalStyleId)) {
      const portalStyle = document.createElement('style')
      portalStyle.id = portalStyleId
      portalStyle.textContent = scopedStudioCss
      document.head.appendChild(portalStyle)
    }

    const globalOverrideId = 'studio-modal-zindex-override'
    if (!document.getElementById(globalOverrideId)) {
      const overrideStyle = document.createElement('style')
      overrideStyle.id = globalOverrideId
      overrideStyle.textContent = `
        .gs-studio-root.gs-cmp-modal {
          z-index: 2147483647 !important;
        }

        .gs-studio-root.gs-cmp-modal .gs-cmp-modal-overlay {
          z-index: 2147483646 !important;
        }
      `
      document.head.appendChild(overrideStyle)
    }
  }, [scopedStudioCss])

  useEffect(() => {
    if (!open) return
    setInitError(null)
  }, [open])

  const setDialogOverlayPointerEvents = useCallback(
    (disable: boolean) => {
      const overlays = document.querySelectorAll<HTMLElement>('[data-slot="dialog-overlay"]')
      overlays.forEach((overlay) => {
        if (disable) {
          if (!dialogOverlayPointerCacheRef.current.has(overlay)) {
            dialogOverlayPointerCacheRef.current.set(overlay, overlay.style.pointerEvents)
          }
          overlay.style.pointerEvents = 'none'
        } else {
          const prev = dialogOverlayPointerCacheRef.current.get(overlay)
          if (prev !== undefined) {
            overlay.style.pointerEvents = prev
          } else {
            overlay.style.removeProperty('pointer-events')
          }
        }
      })

      if (!disable) {
        dialogOverlayPointerCacheRef.current.clear()
      }
    },
    []
  )

  useEffect(() => {
    if (!open) return

    const ensureModalZIndex = () => {
      const modals = Array.from(
        document.querySelectorAll<HTMLElement>('.gs-studio-root.gs-cmp-modal')
      ).filter((modal) => {
        const isOpen = modal.getAttribute('data-headlessui-state') === 'open'
        const hidden =
          modal.hasAttribute('hidden') || modal.getAttribute('aria-hidden') === 'true'
        const rect = modal.getBoundingClientRect()
        const visible = rect.width > 0 && rect.height > 0
        return isOpen && !hidden && visible
      })

      if (modals.length) {
        console.info('[Studio] Active modals detected', modals.map((modal) => ({
          id: modal.id,
          classes: modal.className,
          openState: modal.getAttribute('data-headlessui-state'),
          hidden: modal.hasAttribute('hidden'),
          ariaHidden: modal.getAttribute('aria-hidden'),
          zIndex: window.getComputedStyle(modal).zIndex,
        })))
      } else {
        console.info('[Studio] No active modals detected')
      }

      modals.forEach((modal) => {
        modal.style.zIndex = '2147483647'
        const overlay = modal.querySelector<HTMLElement>('.gs-cmp-modal-overlay')
        if (overlay) overlay.style.zIndex = '2147483646'
      })

      setDialogOverlayPointerEvents(modals.length > 0)
    }

    ensureModalZIndex()
    const observer = new MutationObserver(ensureModalZIndex)
    observer.observe(document.body, { childList: true, subtree: true })

    return () => {
      observer.disconnect()
      setDialogOverlayPointerEvents(false)
    }
  }, [open, setDialogOverlayPointerEvents])

  const importMjml = useCallback(
    (editor: Editor, raw?: string | null) => {
      const mjmlToLoad = raw && raw.trim().length ? raw : DEFAULT_TEMPLATE
      if (lastLoadedMjmlRef.current === mjmlToLoad) return

      try {
        const page = (editor as any).Pages?.getSelected?.()
        const mainComponent = page?.getMainComponent?.()
        if (mainComponent?.setAttributes) {
          mainComponent.components(mjmlToLoad)
        } else {
          editor.setComponents(mjmlToLoad)
        }
      } catch (error) {
        console.error('Failed to set MJML content', error)
        editor.setComponents(mjmlToLoad)
      }

      lastLoadedMjmlRef.current = mjmlToLoad
    },
    []
  )

  useEffect(() => {
    if (!open) return
    if (!licenseKey) {
      console.warn('[Studio] Missing license key, editor will not initialize')
      return
    }
    let mountPoint = mountRef.current
    let cancelled = false
    let rafId = 0

    const initStudio = async (host: HTMLDivElement) => {
      try {
        if (!mountPoint) {
          const shadowRoot = host.shadowRoot ?? host.attachShadow({ mode: 'open' })

          let styleEl = shadowRoot.querySelector<HTMLStyleElement>('style[data-studio-style="true"]')
          if (!styleEl) {
            styleEl = document.createElement('style')
            styleEl.dataset.studioStyle = 'true'
            styleEl.textContent = studioCss
            shadowRoot.appendChild(styleEl)
          }

          mountPoint = shadowRoot.querySelector<HTMLDivElement>('div[data-studio-root="true"]') ?? null

          if (!mountPoint) {
            mountPoint = document.createElement('div')
            mountPoint.dataset.studioRoot = 'true'
            mountPoint.style.width = '100%'
            mountPoint.style.height = '100%'
            mountPoint.style.display = 'block'
            mountPoint.style.zIndex = '999'
            shadowRoot.appendChild(mountPoint)
          }

          mountRef.current = mountPoint
        } else {
          mountPoint.innerHTML = ''
          mountPoint.style.width = '100%'
          mountPoint.style.height = '100%'
          mountPoint.style.display = 'block'
          mountPoint.style.zIndex = '999'
        }

        if (!mountPoint) return

        editorReadyRef.current = false
        console.info('[Studio] Initializing editor', {
          open,
          container: host,
          hasShadow: !!host.shadowRoot,
          mountPoint,
        })

        await createStudioEditor({
          licenseKey,
          root: mountPoint,
          project: {
            type: 'email',
            default: {
              pages: [{ name: 'Email', component: DEFAULT_TEMPLATE }],
            },
          },
          plugins: ({ plugins }) => [...plugins, grapesJSMJML],
          onEditor: async (editor) => {
            if (cancelled) {
              editor.destroy()
              return
            }

            editorRef.current = editor
            console.info('[Studio] Editor instance created')
            console.info('[Studio] Editor keys', Object.keys(editor))
            console.info('[Studio] AssetManager available', (editor as any).AssetManager)

            ;(editor as any).AssetManager?.setConfig?.({
              upload: false,
              uploadFile: async (ev: any) => {
                try {
                  const files: File[] = Array.from(
                    ev?.dataTransfer?.files || ev?.target?.files || []
                  )
                  if (!files.length) return

                  for (const file of files) {
                    const folder = prefix.replace(/\/$/, '')
                    await uploadImage(file, folder)
                  }

                  const list = await listImages({
                    prefix,
                    signed: useSignedUrl,
                    expires: signedExpires,
                  })

                  list.items.forEach((img) => {
                    ;(editor as any).AssetManager?.add?.({ src: img.url, path: img.path })
                  })
                } catch (error) {
                  console.error('Upload error:', error)
                  editor.runCommand('core:alert-info', {
                    title: 'Upload error',
                    content: (error as Error)?.message || String(error),
                  })
                }
              },
            })

            editor.on('asset:remove', async (asset) => {
              const path = asset.get('path')
              if (path) {
                try {
                  await deleteImage(path)
                } catch (error) {
                  console.error('Asset remove error:', error)
                }
              }
            })
          },
          onReady: async (editor) => {
            console.info('[Studio] Editor ready, loading assets and content')
            try {
              const list = await listImages({
                prefix,
                signed: useSignedUrl,
                expires: signedExpires,
              })
              list.items.forEach((img) => {
                ;(editor as any).AssetManager?.add?.({ src: img.url, path: img.path })
              })
            } catch (error) {
              console.error('Asset preload error:', error)
            }

            importMjml(editor, currentRow?.mjml)
            editorReadyRef.current = true
          },
          onDestroy: () => {
            editorRef.current = null
            mountPoint && (mountPoint.innerHTML = '')
            console.info('[Studio] Editor destroyed')
          },
        })
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to initialize GrapesJS Studio', error)
          setInitError((error as Error)?.message || 'Failed to initialize GrapesJS Studio')
        }
      }
    }
    const ensureContainer = () => {
      const container = containerRef.current
      if (!container) {
        rafId = requestAnimationFrame(ensureContainer)
        return
      }

      container.style.display = 'block'
      container.style.width = '100%'
      container.style.height = '100%'
      container.style.position = 'relative'
      container.style.overflow = 'visible'
      container.style.zIndex = '200'
      console.info('[Studio] Container ready', { hasShadow: !!container.shadowRoot })

      if (editorRef.current) return

      void initStudio(container)
    }

    ensureContainer()

    return () => {
      cancelled = true
      cancelAnimationFrame(rafId)
      if (editorRef.current) {
        editorRef.current.destroy()
        editorRef.current = null
      }
      if (mountRef.current) {
        mountRef.current.innerHTML = ''
        mountRef.current = null
      }
      lastLoadedMjmlRef.current = null
      editorReadyRef.current = false
      console.info('[Studio] Cleanup complete')
    }
  }, [open, licenseKey, containerRef, prefix, signedExpires, useSignedUrl, importMjml])

  useEffect(() => {
    if (!open) return
    if (!editorRef.current) return
    if (!editorReadyRef.current) return

    importMjml(editorRef.current, currentRow?.mjml)
  }, [open, currentRow?.mjml, importMjml])

  return {
    editorRef,
    missingLicense: !licenseKey,
    initError,
  }
}
