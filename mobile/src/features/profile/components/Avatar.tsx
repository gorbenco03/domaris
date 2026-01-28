/**
 * RIVA - Avatar Component
 * Displays user avatar with fallback to initials
 */

import React from 'react';
import {
  View,
  Image,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Camera } from 'lucide-react-native';
import { useTheme } from '@/app/providers/ThemeProvider';

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  source?: string;
  firstName?: string;
  lastName?: string;
  size?: AvatarSize;
  showEditButton?: boolean;
  onEditPress?: () => void;
  style?: ViewStyle;
  verified?: boolean;
}

const Avatar: React.FC<AvatarProps> = ({
  source,
  firstName = '',
  lastName = '',
  size = 'md',
  showEditButton = false,
  onEditPress,
  style,
  verified = false,
}) => {
  const { theme } = useTheme();

  const getSizeValue = (): number => {
    switch (size) {
      case 'sm':
        return theme.componentSizes.avatar.sm;
      case 'md':
        return theme.componentSizes.avatar.md;
      case 'lg':
        return theme.componentSizes.avatar.lg;
      case 'xl':
        return 120;
      default:
        return theme.componentSizes.avatar.md;
    }
  };

  const sizeValue = getSizeValue();
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

  const getFontSize = (): number => {
    switch (size) {
      case 'sm':
        return 12;
      case 'md':
        return 18;
      case 'lg':
        return 28;
      case 'xl':
        return 40;
      default:
        return 18;
    }
  };

  const renderContent = () => {
    if (source) {
      return (
        <Image
          source={{ uri: source }}
          style={[
            styles.image,
            {
              width: sizeValue,
              height: sizeValue,
              borderRadius: sizeValue / 2,
            },
          ]}
        />
      );
    }

    return (
      <LinearGradient
        colors={theme.gradients.primary as unknown as [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.initialsContainer,
          {
            width: sizeValue,
            height: sizeValue,
            borderRadius: sizeValue / 2,
          },
        ]}
      >
        <Text
          style={[
            styles.initials,
            {
              fontSize: getFontSize(),
            },
          ]}
        >
          {initials || '?'}
        </Text>
      </LinearGradient>
    );
  };

  return (
    <View style={[styles.container, style]}>
      {renderContent()}
      
      {/* Verification Badge */}
      {verified && size !== 'sm' && (
        <View
          style={[
            styles.verifiedBadge,
            {
              backgroundColor: theme.colors.accent.main,
              width: sizeValue * 0.28,
              height: sizeValue * 0.28,
              borderRadius: sizeValue * 0.14,
              right: 0,
              bottom: 0,
              borderWidth: 2,
              borderColor: theme.colors.surface,
            },
          ]}
        >
          <Text style={styles.checkmark}>✓</Text>
        </View>
      )}

      {/* Edit Button */}
      {showEditButton && onEditPress && (
        <TouchableOpacity
          onPress={onEditPress}
          style={[
            styles.editButton,
            {
              backgroundColor: theme.colors.accent.main,
              width: sizeValue * 0.32,
              height: sizeValue * 0.32,
              borderRadius: sizeValue * 0.16,
              borderWidth: 3,
              borderColor: theme.colors.surface,
            },
          ]}
          activeOpacity={0.8}
        >
          <Camera
            size={sizeValue * 0.14}
            color="#ffffff"
            strokeWidth={2.5}
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  image: {
    resizeMode: 'cover',
  },
  initialsContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    color: '#ffffff',
    fontWeight: '600',
  },
  editButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedBadge: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default Avatar;
