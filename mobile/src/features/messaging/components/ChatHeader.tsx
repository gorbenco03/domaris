/**
 * IMOBI - Chat Header Component
 * Header for the chat screen showing participant info and property
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { ArrowLeft, Phone, MoreVertical, User, Home } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/app/providers/ThemeProvider';
import { Participant, PropertyPreview } from '../types';

// ============================================
// TYPES
// ============================================

interface ChatHeaderProps {
  participant: Participant;
  property?: PropertyPreview;
  onBackPress: () => void;
  onCallPress?: () => void;
  onMenuPress?: () => void;
  onPropertyPress?: () => void;
}

// ============================================
// COMPONENT
// ============================================

const ChatHeader: React.FC<ChatHeaderProps> = ({
  participant,
  property,
  onBackPress,
  onCallPress,
  onMenuPress,
  onPropertyPress,
}) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const formatPrice = (price: number, currency: 'EUR' | 'RON') => {
    const symbol = currency === 'EUR' ? '€' : 'lei';
    return `${price.toLocaleString('ro-RO')}${symbol}`;
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top,
          backgroundColor: theme.colors.surface,
          borderBottomColor: theme.colors.border,
          ...theme.shadows.sm,
        },
      ]}
    >
      {/* Main header row */}
      <View style={styles.mainRow}>
        {/* Back button */}
        <TouchableOpacity
          onPress={onBackPress}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>

        {/* Avatar */}
        <View style={styles.avatarContainer}>
          {participant.avatar ? (
            <Image
              source={{ uri: participant.avatar }}
              style={[
                styles.avatar,
                { borderRadius: theme.borderRadius.full },
              ]}
            />
          ) : (
            <View
              style={[
                styles.avatarPlaceholder,
                {
                  backgroundColor: theme.colors.primary.light,
                  borderRadius: theme.borderRadius.full,
                },
              ]}
            >
              <User size={18} color="#ffffff" />
            </View>
          )}
          {participant.isOnline && (
            <View
              style={[
                styles.onlineIndicator,
                { backgroundColor: theme.colors.accent.main },
              ]}
            />
          )}
        </View>

        {/* Participant info */}
        <View style={styles.info}>
          <Text
            style={[
              styles.name,
              { color: theme.colors.textPrimary },
            ]}
            numberOfLines={1}
          >
            {participant.name}
          </Text>
          <Text
            style={[
              styles.status,
              { color: participant.isOnline 
                ? theme.colors.accent.main 
                : theme.colors.textTertiary 
              },
            ]}
          >
            {participant.isOnline ? 'Online' : 'Offline'}
          </Text>
        </View>

        {/* Action buttons */}
        <View style={styles.actions}>
          {onCallPress && (
            <TouchableOpacity
              onPress={onCallPress}
              style={styles.actionButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Phone size={22} color={theme.colors.primary.main} />
            </TouchableOpacity>
          )}
          {onMenuPress && (
            <TouchableOpacity
              onPress={onMenuPress}
              style={styles.actionButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MoreVertical size={22} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Property preview row */}
      {property && (
        <TouchableOpacity
          onPress={onPropertyPress}
          style={[
            styles.propertyRow,
            {
              backgroundColor: theme.colors.background,
              borderTopColor: theme.colors.divider,
            },
          ]}
          activeOpacity={0.7}
        >
          <Home size={16} color={theme.colors.textSecondary} />
          <Text
            style={[
              styles.propertyTitle,
              { color: theme.colors.textSecondary },
            ]}
            numberOfLines={1}
          >
            {property.title}
          </Text>
          <Text
            style={[
              styles.propertyPrice,
              { color: theme.colors.accent.main },
            ]}
          >
            {formatPrice(property.price, property.currency)}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 10,
  },
  avatar: {
    width: 40,
    height: 40,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 1,
  },
  status: {
    fontSize: 12,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  propertyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    gap: 8,
  },
  propertyTitle: {
    flex: 1,
    fontSize: 13,
  },
  propertyPrice: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ChatHeader;
