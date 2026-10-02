import { get, post, put } from './client';
import { User, LearnerProfile } from '../types';

export interface LoginResponse {
  user: User;
  token: string;
}

export interface RegisterResponse {
  user: User;
  token: string;
}

export const authApi = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    return post<LoginResponse>('/auth/login', { email, password });
  },

  register: async (full_name: string, email: string, password: string): Promise<RegisterResponse> => {
    return post<RegisterResponse>('/auth/register', { full_name, email, password });
  },

  logout: async (): Promise<void> => {
    await post<{ logged_out: boolean }>('/auth/logout');
  },

  getCurrentUser: async (): Promise<User> => {
    return get<User>('/auth/me');
  },

  updateProfile: async (data: Partial<User>): Promise<User> => {
    return put<User>('/auth/profile', data);
  },

  saveLearnerProfile: async (profile: Partial<LearnerProfile>): Promise<LearnerProfile> => {
    return post<LearnerProfile>('/auth/onboarding', profile);
  },

  getLearnerProfile: async (): Promise<LearnerProfile | null> => {
    return get<LearnerProfile | null>('/auth/onboarding');
  },
};
