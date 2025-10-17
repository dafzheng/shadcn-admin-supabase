import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AppNotification } from '../data/schema'

type NotificationState = {
  notifications: AppNotification[]
  isLoading: boolean
  lastSyncedAt: string | null
  setNotifications: (notifications: AppNotification[]) => void
  upsertNotification: (notification: AppNotification) => void
  markAsRead: (id: string, readAt: string) => void
  markAsUnread: (id: string) => void
  markManyAsRead: (ids: string[], readAt: string) => void
  markManyAsUnread: (ids: string[]) => void
  markAllAsRead: (readAt: string) => void
  setLoading: (isLoading: boolean) => void
}

const MAX_STORED_NOTIFICATIONS = 50

export const useNotificationsStore = create<NotificationState>()(
  persist(
    (set) => ({
      notifications: [],
      isLoading: false,
      lastSyncedAt: null,
      setNotifications: (notifications) =>
        set((state) => {
          const sorted = [...notifications]
            .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
            .slice(0, MAX_STORED_NOTIFICATIONS)

          return {
            notifications: sorted.map((notification) => {
              const existing = state.notifications.find((prev) => prev.id === notification.id)
              return existing
                ? {
                    ...existing,
                    ...notification,
                  }
                : notification
            }),
            lastSyncedAt: new Date().toISOString(),
          }
        }),
      upsertNotification: (notification) =>
        set((state) => {
          const existingIndex = state.notifications.findIndex((item) => item.id === notification.id)
          const next: AppNotification[] = existingIndex === -1
            ? [
                {
                  ...notification,
                },
                ...state.notifications,
              ]
            : state.notifications.map((item, index) =>
                index === existingIndex
                  ? {
                      ...item,
                      ...notification,
                    }
                  : item
              )

          return {
            notifications: next.slice(0, MAX_STORED_NOTIFICATIONS),
          }
        }),
      markAsRead: (id, readAt) =>
        set((state) => ({
          notifications: state.notifications.map((item) =>
            item.id === id
              ? {
                  ...item,
                  readAt,
                }
              : item
          ),
        })),
      markAllAsRead: (readAt) =>
        set((state) => ({
          notifications: state.notifications.map((item) => ({
            ...item,
            readAt,
          })),
        })),
      markAsUnread: (id) =>
        set((state) => ({
          notifications: state.notifications.map((item) =>
            item.id === id
              ? {
                  ...item,
                  readAt: null,
                }
              : item
          ),
        })),
      markManyAsRead: (ids, readAt) =>
        set((state) => ({
          notifications: state.notifications.map((item) =>
            ids.includes(item.id)
              ? {
                  ...item,
                  readAt,
                }
              : item
          ),
        })),
      markManyAsUnread: (ids) =>
        set((state) => ({
          notifications: state.notifications.map((item) =>
            ids.includes(item.id)
              ? {
                  ...item,
                  readAt: null,
                }
              : item
          ),
        })),
      setLoading: (isLoading) => set(() => ({ isLoading })),
    }),
    {
      name: 'notifications-store',
      partialize: (state) => ({
        notifications: state.notifications,
        lastSyncedAt: state.lastSyncedAt,
      }),
      version: 1,
    }
  )
)

export function mapNotificationLevelToTone(level: AppNotification['level']): 'success' | 'warning' | 'error' | 'info' {
  switch (level) {
    case 'success':
      return 'success'
    case 'warning':
      return 'warning'
    case 'error':
      return 'error'
    default:
      return 'info'
  }
}
