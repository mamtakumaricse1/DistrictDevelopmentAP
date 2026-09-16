import { apiGet, apiPost } from './client';

export type NotificationRecord = {
  id: string;
  title: string;
  body: string;
  type: string;
  createdAt: string;
  read: boolean;
};

export const notificationsApi = {
  list: () => apiGet<NotificationRecord[]>('/notifications'),
  unreadCount: () => apiGet<{ unread: number }>('/notifications/unread-count'),
  markRead: (id: string) => apiPost<{ id: string; read: boolean }>(`/notifications/${id}/read`, {}),
};
