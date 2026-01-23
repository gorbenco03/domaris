
import { apiClient } from '@/lib/client';
import type { 
  ILoginEmailDto, 
  ILoginPhoneDto,
  IRegisterEmailDto,
  IRegisterPhoneDto,
  IAuthResponse,
  IUser
} from '@domaris/types';

// Define locally if missing in shared types
interface IOtpSentResponse {
    success: boolean;
    message?: string;
    expiresIn?: number;
}

export const authApi = {
  loginWithEmail: async (data: ILoginEmailDto): Promise<IAuthResponse> => {
    const response = await apiClient.post<IAuthResponse>('/auth/login', data);
    return response.data;
  },
  loginWithPhone: async (data: ILoginPhoneDto): Promise<IAuthResponse> => {
    const response = await apiClient.post<IAuthResponse>('/auth/login/phone', data);
    return response.data;
  },
  registerWithEmail: async (data: IRegisterEmailDto): Promise<IOtpSentResponse> => {
    const response = await apiClient.post<IOtpSentResponse>('/auth/register', data);
    return response.data;
  },
  registerWithPhone: async (data: IRegisterPhoneDto): Promise<IOtpSentResponse> => {
    const response = await apiClient.post<IOtpSentResponse>('/auth/register/phone', data);
    return response.data;
  },
  getCurrentUser: async (): Promise<IUser> => {
    const response = await apiClient.get<IUser>('/auth/me');
    return response.data;
  },
  logout: async () => {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  }
};
