/**
 * RIVA - User Hooks
 * React Query hooks for user profile management
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/config/constants';
import { useAuth } from '@/app/providers/AuthProvider';
import { apiClient } from '@/core/api/client';
import { API_ENDPOINTS } from '@/core/api/endpoints';

// We can reuse IUser from core types if available, or define local interface
import type { IUser } from '@/core/api/types';

export interface IUpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  bio?: string;
  city?: string;
  county?: string;
  avatar?: string;
  location?: string;
}

/**
 * Get current user profile (full details)
 */
export const useUserProfile = () => {
  const { user } = useAuth(); // Auth context usually has basic info
  return useQuery({
    queryKey: [QUERY_KEYS.USER_PROFILE, user?.id],
    queryFn: async () => {
      const response = await apiClient.get<IUser>(API_ENDPOINTS.USERS.PROFILE);
      return response.data;
    },
    enabled: !!user?.id,
  });
};

/**
 * Update user profile mutation
 */
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const { user, updateUser } = useAuth();

  return useMutation({
    mutationFn: async (data: IUpdateProfileRequest) => {
      // In a real app we might upload avatar first if it's a blob/file URI
      const response = await apiClient.patch<IUser>(API_ENDPOINTS.USERS.PROFILE, data);
      return response.data;
    },
    onSuccess: (updatedUser) => {
      // Update React Query cache
      queryClient.setQueryData([QUERY_KEYS.USER_PROFILE, user?.id], updatedUser);
      
      // Update Auth Context state if needed (to reflect changes instantly across app)
      updateUser(updatedUser);
    },
  });
};

/**
 * Upload avatar mutation
 */
export const useUploadAvatar = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await apiClient.patch<{ avatarUrl: string }>(
        API_ENDPOINTS.USERS.UPLOAD_AVATAR,
        formData,
        {
            headers: { 'Content-Type': 'multipart/form-data' }
        }
      );
      return response.data;
    },
    onSuccess: (data) => {
       // Update cache immediately with new avatar URL
       queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.USER_PROFILE, user?.id] });
    }
  });
};
