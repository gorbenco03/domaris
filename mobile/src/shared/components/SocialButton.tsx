/**
 * IMOBI - Social Login Button Component
 * Google, Apple, Facebook login buttons
 */

import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from '@/app/providers/ThemeProvider';

type SocialProvider = 'google' | 'apple' | 'facebook';

interface SocialButtonProps {
  provider: SocialProvider;
  onPress: () => void;
  title?: string;
  disabled?: boolean;
  style?: ViewStyle;
}

const SocialButton: React.FC<SocialButtonProps> = ({
  provider,
  onPress,
  title,
  disabled = false,
  style,
}) => {
  const { theme } = useTheme();

  const getProviderConfig = () => {
    switch (provider) {
      case 'google':
        return {
          backgroundColor: '#ffffff',
          textColor: '#1f1f1f',
          borderColor: theme.colors.border,
          icon: 'G',
          iconColor: '#4285F4',
          defaultTitle: 'Continuă cu Google',
        };
      case 'apple':
        return {
          backgroundColor: '#000000',
          textColor: '#ffffff',
          borderColor: '#000000',
          icon: '',
          iconColor: '#ffffff',
          defaultTitle: 'Continuă cu Apple',
        };
      case 'facebook':
        return {
          backgroundColor: '#1877F2',
          textColor: '#ffffff',
          borderColor: '#1877F2',
          icon: 'f',
          iconColor: '#ffffff',
          defaultTitle: 'Continuă cu Facebook',
        };
    }
  };

  const config = getProviderConfig();

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      style={[
        styles.container,
        {
          backgroundColor: config.backgroundColor,
          borderColor: config.borderColor,
          borderRadius: theme.borderRadius.lg,
          height: theme.componentSizes.button.height,
        },
        disabled && styles.disabled,
        style,
      ]}
    >
      <View style={styles.iconContainer}>
        {provider === 'google' && (
          <View style={styles.googleIcon}>
            <Text style={[styles.googleG, { color: '#4285F4' }]}>G</Text>
          </View>
        )}
        {provider === 'apple' && (
          <Text style={[styles.appleIcon, { color: config.iconColor }]}></Text>
        )}
        {provider === 'facebook' && (
          <Text style={[styles.facebookIcon, { color: config.iconColor }]}>f</Text>
        )}
      </View>
      <Text style={[styles.text, { color: config.textColor }]}>
        {title || config.defaultTitle}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    paddingHorizontal: 16,
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  iconContainer: {
    marginRight: 12,
  },
  googleIcon: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleG: {
    fontSize: 20,
    fontWeight: '700',
  },
  appleIcon: {
    fontSize: 24,
    fontWeight: '400',
  },
  facebookIcon: {
    fontSize: 24,
    fontWeight: '700',
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SocialButton;
