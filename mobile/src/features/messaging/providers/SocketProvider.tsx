/**
 * RIVA - Socket Provider
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
    let heartbeatTimer: ReturnType<typeof setInterval> | null = null;

    const connectSocket = async () => {
      const accessToken = await tokenManager.getAccessToken();
      if (accessToken && isActive) {
        socketService.connect(accessToken);
        if (!heartbeatTimer) {
          heartbeatTimer = setInterval(() => {
            socketService.sendPresencePing();
          }, 20000);
        }
      }
    };

    connectSocket();

    return () => {
      isActive = false;
      if (heartbeatTimer) {
        clearInterval(heartbeatTimer);
        heartbeatTimer = null;
      }
      socketService.disconnect();
    };
  }, [isAuthenticated]);

  return <>{children}</>;
};

export default SocketProvider;
