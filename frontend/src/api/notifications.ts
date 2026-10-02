import { get, post } from './client';
import { NotificationItem } from '../types';

export const notificationsApi = {
  getNotifications: async (): Promise<NotificationItem[]> => {
    return get<NotificationItem[]>('/notifications');
  },

  markAsRead: async (id: string): Promise<{ success: boolean }> => {
    return post<{ success: boolean }>(`/notifications/${id}/read`);
  },

  markAllAsRead: async (): Promise<{ success: boolean }> => {
    return post<{ success: boolean }>('/notifications/read-all');
  },
};
