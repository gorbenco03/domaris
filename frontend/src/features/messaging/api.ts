import { apiClient } from '@/lib/client';
import type { IConversation, IConversationListItem, IMessage } from '@domaris/types';

export const messagingApi = {
  getConversations: async (params?: {
    type?: 'all' | 'unread' | 'archived';
    page?: number;
    limit?: number;
  }): Promise<IConversationListItem[]> => {
    const response = await apiClient.get<{ data: IConversationListItem[] }>('/conversations', { params });
    return response.data.data;
  },

  getConversation: async (id: string): Promise<IConversation> => {
    const response = await apiClient.get<IConversation>(`/conversations/${id}`);
    return response.data;
  },

  getMessages: async (conversationId: string): Promise<IMessage[]> => {
    // Assuming backend returns messages in a consistent format
    const response = await apiClient.get<{ data: IMessage[] }>(`/conversations/${conversationId}/messages`);
    return response.data.data;
  },

  startConversation: async (data: { propertyId: number; message?: string }): Promise<IConversation> => {
    const response = await apiClient.post<IConversation>('/conversations', data);
    return response.data;
  },

  sendMessage: async (
    conversationId: string,
    content: string,
    type: 'TEXT' | 'IMAGE' | 'VIEWING_REQUEST' = 'TEXT'
  ): Promise<IMessage> => {
    const response = await apiClient.post<IMessage>(`/conversations/${conversationId}/messages`, {
      content,
      type,
    });
    return response.data;
  },

  markMessagesAsRead: async (conversationId: string): Promise<{ success: boolean }> => {
    const response = await apiClient.post<{ success: boolean }>(`/conversations/${conversationId}/read`);
    return response.data;
  },

  archiveConversation: async (conversationId: string): Promise<{ success: boolean }> => {
    const response = await apiClient.post<{ success: boolean }>(`/conversations/${conversationId}/archive`);
    return response.data;
  },

  getUnreadCount: async (): Promise<{ count: number }> => {
    const response = await apiClient.get<{ count: number }>('/conversations/unread-count');
    return response.data;
  },
};
