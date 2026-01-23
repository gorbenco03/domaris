import { apiClient } from '@/lib/client';
import { IUser, IUpdateUserDto } from '@domaris/types';

export type { IUser };
export type IUpdateProfileRequest = IUpdateUserDto;



export const profileApi = {
  getProfile: async (): Promise<IUser> => {
    const response = await apiClient.get<IUser>('/users/profile');
    return response.data;
  },

  updateProfile: async (data: IUpdateProfileRequest): Promise<IUser> => {
    const response = await apiClient.patch<IUser>('/users/profile', data);
    return response.data;
  },

  uploadAvatar: async (file: File): Promise<{ avatarUrl: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.patch<{ avatarUrl: string }>(
      '/users/profile/avatar',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },
};
