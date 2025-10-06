// hooks/useGrapesEditor.ts
import { useEffect, useRef, RefObject } from 'react'
import grapesjs, { Editor } from 'grapesjs'
import grapesJSMJML from 'grapesjs-mjml'
import 'grapesjs/dist/css/grapes.min.css';
import { Email } from '../data/schema'
import { uploadImage, listImages, deleteImage } from '../api/image'


type AssetOptions = {
  prefix?: string;         // 例如 'email/'；可留空
  useSignedUrl?: boolean;  // 私有桶設 true
  signedExpires?: number;  // 簽名 URL 秒數（預設 600）
}

export function useGrapesEditor(
  open: boolean,
  containerRef: RefObject<HTMLDivElement | null>,
  currentRow?: Email,
  assetOpts: AssetOptions = { prefix: '', useSignedUrl: false, signedExpires: 600 },
) {
  const editorRef = useRef<Editor | null>(null)

  useEffect(() => {
    if (!open) return
    let rafId: number

    const tryInit = () => {
      if (containerRef.current && !editorRef.current) {
        const ed = grapesjs.init({
          container: containerRef.current,
          height: '100%',
          width: '100%',
          fromElement: false,
          storageManager: false,
          plugins: [grapesJSMJML],
          pluginsOpts: {
            'grapesjs-plugin-mjml': {},
          },
          assetManager: {
            upload: false,      // 我們用自訂 uploadFile
            // embedAsBase64: false,   // 不用 base64
            uploadFile: async (ev: any) => {
              try {
                const files: File[] = Array.from(
                  ev?.dataTransfer?.files || ev?.target?.files || []
                );
                if (!files.length) return;

                for (const file of files) {
                  // 1) 上傳（你自訂的 API）
                  const folder = (assetOpts?.prefix ?? '').replace(/\/$/, '');
                  const up = await uploadImage(file, folder);
                  const path: string = up.path;

                  // 2) 取回可用 URL（public/signed）
                  const list = await listImages({
                    prefix: assetOpts.prefix,
                    signed: assetOpts.useSignedUrl,
                    expires: assetOpts.signedExpires,
                  });
                  list.items.forEach(img => {
                    ed.AssetManager.add({ src: img.url, path: img.path });
                  });

                }
              } catch (err: any) {
                console.error('Upload error:', err);
                ed.runCommand('core:alert-info', {
                  title: 'Upload error',
                  content: err?.message || String(err),
                });
              }
            }
          },

        })

        editorRef.current = ed

        ed.on('load', async () => {
          if (!document.getElementById('grapes-icon-style')) {
            const style = document.createElement('style');
            style.id = 'grapes-icon-style';
            style.innerHTML = `
          .gjs-pn-buttons svg {
            width: 18px;
            height: 18px;
            font-size: 18px;
            vertical-align: middle;
          }
        `;
            document.head.appendChild(style);
          }

          let result = await listImages({
            prefix: assetOpts.prefix,
            signed: assetOpts.useSignedUrl,
            expires: assetOpts.signedExpires,
          })

          console.log('result = ', result)
          result.items.forEach(img => {
            ed.AssetManager.add({ src: img.url, path: img.path });
          });

        });

        ed.on('asset:remove', async (asset) => {

          const path = asset.get('path')
          const result = await deleteImage(path);

        });

        // 設定初始內容
        if (currentRow?.content) {
          ed.setComponents(currentRow.content)
        } else {
          ed.setComponents(`
            <mjml>
              <mj-body></mj-body>
            </mjml>
          `)
        }

        console.log('init complete!')
      } else {
        rafId = requestAnimationFrame(tryInit)
      }
    }

    tryInit()

    return () => {
      cancelAnimationFrame(rafId)
      if (editorRef.current) {
        editorRef.current.destroy()
        editorRef.current = null
      }
    }
  }, [open, containerRef, currentRow, assetOpts.prefix, assetOpts.useSignedUrl, assetOpts.signedExpires])

  return editorRef
}
