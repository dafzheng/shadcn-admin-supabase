import { useEffect, useRef } from 'react'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { toast } from 'sonner'
import { useSupabaseAuth } from '@/features/auth/supabase/provider'
import { useAuthStore, type AuthActiveOrganization } from '@/stores/auth-store'
import { parseNotification, parseNotificationList, type AppNotification } from '../data/schema'
import {
  mapNotificationLevelToTone,
  useNotificationsStore,
} from '../store/notifications-store'
import { NOTIFICATIONS_TABLE } from '../constants'

export function NotificationsListener() {
  const { client } = useSupabaseAuth()
  const accessToken = useAuthStore((state) => state.auth.accessToken)
  const authUser = useAuthStore((state) => state.auth.user)
  const upsertNotification = useNotificationsStore((state) => state.upsertNotification)
  const setNotifications = useNotificationsStore((state) => state.setNotifications)
  const setLoading = useNotificationsStore((state) => state.setLoading)
  const userId = authUser?.id ?? null
  const activeOrgId = resolveActiveOrgId(authUser?.activeOrg ?? null)

  const channelRef = useRef<ReturnType<typeof client.channel> | null>(null)

  // Fetch initial notifications
  useEffect(() => {
    let isMounted = true
    if (!accessToken) return () => {
      isMounted = false
    }

    setLoading(true)
    client
      .rpc('get_broadcast_notifications', {
        p_org_id: activeOrgId,
        p_only_unread: false,
        p_level: null,
        p_q: null,
        p_include_global: true,
        p_include_expired: false,
        p_since: null,
        p_until: null,
        p_limit: 50,
        p_offset: 0,
      })
      .then(({ data, error }) => {
        if (!isMounted) return
        if (error) {
          toast.error('Failed to load notifications. Please try again.')
          return
        }

        const items =
          data && typeof data === 'object' && data !== null
            ? (data as { items?: unknown }).items ?? []
            : []
        const parsed = parseNotificationList(items)
        setNotifications(parsed)
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [accessToken, activeOrgId, client, setLoading, setNotifications, userId])

  // Subscribe to realtime notifications
  useEffect(() => {
    if (!accessToken) return
    if (channelRef.current) {
      client.removeChannel(channelRef.current)
      channelRef.current = null
    }

    client.realtime.setAuth(accessToken)
    client.realtime.connect()

    const channel = client.channel(buildChannelName(userId, activeOrgId))

    const handlePayload = (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
      const parsed = parseNotification(payload.new)
      if (!parsed || !shouldReceiveNotification(parsed, userId, activeOrgId)) {
        return
      }

      upsertNotification(parsed)
      toast[mapNotificationLevelToTone(parsed.level)](parsed.title, {
        description: parsed.message,
      })
    }

    channel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: NOTIFICATIONS_TABLE,
        },
        handlePayload
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: NOTIFICATIONS_TABLE,
        },
        handlePayload
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        client.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [accessToken, activeOrgId, client, upsertNotification, userId])

  return null
}

function resolveActiveOrgId(activeOrg: AuthActiveOrganization | null): string | null {
  if (!activeOrg || typeof activeOrg !== 'object') return null
  const record = activeOrg as Record<string, unknown>
  const candidates = ['org_id', 'organization_id', 'tenant_id', 'id']
  for (const key of candidates) {
    const value = record[key]
    if (typeof value === 'string' && value) {
      return value
    }
  }
  return null
}

function shouldReceiveNotification(notification: AppNotification, userId: string | null, activeOrgId: string | null) {
  if (notification.userId) {
    return notification.userId === userId
  }
  if (notification.orgId) {
    return notification.orgId === activeOrgId
  }
  return !notification.userId && !notification.orgId
}

function buildChannelName(userId: string | null, activeOrgId: string | null) {
  return `notifications:${userId ?? 'anonymous'}:${activeOrgId ?? 'no-org'}`
}
