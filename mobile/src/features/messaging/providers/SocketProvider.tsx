/**
 * IMOBI - Socket Provider
 * Manages socket connection lifecycle and live updates.
 */

import React, { useEffect } from 'react';
import { useAuth } from '@/app/providers/AuthProvider';
import { tokenManager } from '@/core/auth/tokenManager';
import socketService from '@/features/messaging/services/socketService';
import { useSocketUpdates } from '@/features/messaging/services';

interface SocketProviderProps {
  children: React.ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();

  // Enable global socket cache updates
  useSocketUpdates();

  useEffect(() => {
    if (!isAuthenticated) {
      socketService.disconnect();
      return;
    }

    let isActive = true;

    const connectSocket = async () => {
      const accessToken = await tokenManager.getAccessToken();
      if (accessToken && isActive) {
        socketService.connect(accessToken);
      }
    };

    connectSocket();

    return () => {
      isActive = false;
      socketService.disconnect();
    };
  }, [isAuthenticated]);

  return <>{children}</>;
};

export default SocketProvider;
