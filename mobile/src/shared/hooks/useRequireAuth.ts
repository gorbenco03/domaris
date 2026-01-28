/**
 * RIVA - Require Auth Hook
 * Prompts guest users to authenticate before protected actions.
 */

import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '@/app/providers/AuthProvider';

interface RequireAuthOptions {
  title?: string;
  message?: string;
}

export const useRequireAuth = () => {
  const { isAuthenticated } = useAuth();
  const navigation = useNavigation();

  const openAuth = () => {
    const parent = navigation.getParent?.();
    const root = parent?.getParent?.() ?? parent ?? navigation;
    // @ts-ignore - Root navigator route
    root.navigate('Auth');
  };

  const requireAuth = (options?: RequireAuthOptions) => {
    if (isAuthenticated) {
      return true;
    }

    Alert.alert(
      options?.title || 'Autentificare necesară',
      options?.message || 'Pentru această acțiune trebuie să te autentifici.',
      [
        { text: 'Anulează', style: 'cancel' },
        { text: 'Autentificare', onPress: openAuth },
      ]
    );

    return false;
  };

  return { isAuthenticated, requireAuth, openAuth };
};

export default useRequireAuth;
