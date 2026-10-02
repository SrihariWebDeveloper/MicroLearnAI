import { get, patch } from './client';

export interface AdminStatus {
  database_connected: boolean;
  environment: string;
  user_count: number;
  generated_at: string;
}

export interface AdminUser {
  id: string;
  full_name: string;
  email: string;
  role: 'learner' | 'admin';
  created_at: string;
}

export const adminApi = {
  getStatus: () => get<AdminStatus>('/admin/status'),
  getUsers: () => get<AdminUser[]>('/admin/users'),
  updateRole: (userId: string, role: AdminUser['role']) =>
    patch<{ updated: boolean }>(`/admin/users/${userId}/role`, { role }),
};