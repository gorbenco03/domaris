/**
 * IMOBI - Social Login Button Component
 * Google, Apple, Facebook login buttons
 */

import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, ViewStyle, Platform } from 'react-native';
import { useTheme } from '@/app/providers/ThemeProvider';
import { Chrome, Apple, Facebook } from 'lucide-react-native';

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
          backgroundColor: '#FFFFFF',
          textColor: '#000000',
          borderColor: '#E2E8F0',
          Icon: Chrome,
          iconColor: '#4285F4',
          defaultTitle: 'Continuă cu Google',
        };
      case 'apple':
        return {
          backgroundColor: '#000000',
          textColor: '#FFFFFF',
          borderColor: '#000000',
          Icon: Apple,
          iconColor: '#FFFFFF',
          defaultTitle: 'Continuă cu Apple',
        };
      case 'facebook':
        return {
          backgroundColor: '#1877F2',
          textColor: '#FFFFFF',
          borderColor: '#1877F2',
          Icon: Facebook,
          iconColor: '#FFFFFF',
          defaultTitle: 'Continuă cu Facebook',
        };
    }
  };

  const config = getProviderConfig();
  const IconComponent = config.Icon;

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
          borderRadius: 12,
        },
        disabled && styles.disabled,
        style,
      ]}
    >
      <View style={styles.iconContainer}>
        <IconComponent 
          size={20} 
          color={config.iconColor} 
        />
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
    paddingVertical: 16,
    width: '100%',
    marginBottom: 12,
  },
  disabled: {
    opacity: 0.5,
  },
  iconContainer: {
    marginRight: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialIcon: {
    marginTop: Platform.OS === 'ios' ? -1 : 0,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});

export default SocialButton;
