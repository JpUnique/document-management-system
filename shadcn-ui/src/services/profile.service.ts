import { api } from './api';
import type { AuthUser } from './auth.service';

export const profileService = {
  async update(payload: { name?: string; avatar_url?: string | null; department?: string | null }): Promise<AuthUser> {
    const data = await api.patch<{ user: AuthUser }>('/profile', payload);
    return data.user;
  },
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await api.post('/profile/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
  },
};