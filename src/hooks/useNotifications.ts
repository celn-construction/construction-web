'use client';

import { api } from '@/trpc/react';

export function useNotifications(activeOrganizationId: string, notifMenuOpen: boolean) {
  const utils = api.useUtils();

  const { data: unreadCount = 0 } = api.notification.unreadCount.useQuery(
    { organizationId: activeOrganizationId },
    { retry: false, enabled: !!activeOrganizationId, refetchInterval: 30000 }
  );

  const { data: notificationsData } = api.notification.list.useQuery(
    { organizationId: activeOrganizationId, limit: 20 },
    { retry: false, enabled: notifMenuOpen && !!activeOrganizationId }
  );

  const markAsRead = api.notification.markAsRead.useMutation({
    onSuccess: () => {
      void utils.notification.unreadCount.invalidate();
      void utils.notification.list.invalidate();
    },
  });

  const markAllAsRead = api.notification.markAllAsRead.useMutation({
    onSuccess: () => {
      void utils.notification.unreadCount.invalidate();
      void utils.notification.list.invalidate();
    },
  });

  return { unreadCount, notificationsData, markAsRead, markAllAsRead };
}
