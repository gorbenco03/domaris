/**
 * RIVA - Require Verification Hook
 * Prompts user to complete verification before protected actions.
 */

import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '@/app/providers/AuthProvider';
import { useRequireAuth } from './useRequireAuth';

interface RequireVerificationOptions {
  title?: string;
  message?: string;
}

export const useRequireVerification = () => {
  const { user } = useAuth();
  const { requireAuth } = useRequireAuth();
  const navigation = useNavigation();

  const openVerification = () => {
    const parent = navigation.getParent?.();
    const root = parent?.getParent?.() ?? parent ?? navigation;
    // @ts-ignore - Root navigator route
    root.navigate('Main', {
      screen: 'ProfileTab',
      params: { screen: 'VerificationHub' },
    });
  };

  const requireVerification = (
    requiredLevel: number,
    options?: RequireVerificationOptions,
  ) => {
    if (!requireAuth()) {
      return false;
    }

    const currentLevel = user?.verificationLevel ?? 0;
    if (currentLevel >= requiredLevel) {
      return true;
    }

    Alert.alert(
      options?.title || 'Verificare necesară',
      options?.message || 'Finalizează verificarea pentru a continua.',
      [
        { text: 'Anulează', style: 'cancel' },
        { text: 'Verifică acum', onPress: openVerification },
      ],
    );

    return false;
  };

  return { requireVerification };
};

export default useRequireVerification;
