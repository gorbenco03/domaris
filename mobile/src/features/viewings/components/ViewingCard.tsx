/**
 * IMOBI - Viewing Card Component
 * Displays a viewing appointment with status and actions
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useTheme } from '@/app/providers/ThemeProvider';
import { Viewing, STATUS_INFO } from '../types';
import {
  Clock,
  MapPin,
  User,
  Calendar,
  RefreshCw,
  XCircle,
  CheckCircle,
  AlertCircle,
  Home,
} from 'lucide-react-native';

interface ViewingCardProps {
  viewing: Viewing;
  onPress?: () => void;
  onReschedule?: () => void;
  onCancel?: () => void;
  showActions?: boolean;
  viewType?: 'seeker' | 'owner';
}

const ViewingCard: React.FC<ViewingCardProps> = ({
  viewing,
  onPress,
  onReschedule,
  onCancel,
  showActions = true,
  viewType = 'seeker',
}) => {
  const { theme } = useTheme();
  const statusInfo = STATUS_INFO[viewing.status];
  
  const formatDate = (slot: { date: string; startTime: string; endTime: string }) => {
    const date = new Date(slot.date);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (slot.date === today.toISOString().split('T')[0]) {
      return 'Astăzi';
    } else if (slot.date === tomorrow.toISOString().split('T')[0]) {
      return 'Mâine';
    }
    
    return date.toLocaleDateString('ro-RO', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
    });
  };
  
  const slot = viewing.confirmedSlot || viewing.requestedSlots[0];
  const contact = viewType === 'seeker' ? viewing.owner : viewing.seeker;
  
  const getStatusIcon = () => {
    const iconProps = { size: 16, color: statusInfo.color };
    switch (viewing.status) {
      case 'pending':
        return <Clock {...iconProps} />;
      case 'confirmed':
        return <CheckCircle {...iconProps} />;
      case 'rescheduled':
        return <RefreshCw {...iconProps} />;
      case 'cancelled':
        return <XCircle {...iconProps} />;
      case 'no_show':
        return <AlertCircle {...iconProps} />;
      default:
        return <CheckCircle {...iconProps} />;
    }
  };

  return (
    <TouchableOpacity
      style={[styles.container, { 
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border,
        ...theme.shadows.card,
      }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Status Badge */}
      <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '20' }]}>
        {getStatusIcon()}
        <Text style={[styles.statusText, { color: statusInfo.color }]}>
          {statusInfo.label}
        </Text>
      </View>
      
      {/* Main Content */}
      <View style={styles.content}>
        {/* Date & Time */}
        <View style={styles.dateTimeSection}>
          <View style={[styles.timeBox, { backgroundColor: theme.colors.primary.main }]}>
            <Clock size={16} color="#fff" />
            <Text style={styles.timeText}>
              {slot.startTime} - {slot.endTime}
            </Text>
          </View>
          <View style={styles.dateBox}>
            <Calendar size={14} color={theme.colors.textSecondary} />
            <Text style={[styles.dateText, { color: theme.colors.textSecondary }]}>
              {formatDate(slot)}
            </Text>
          </View>
        </View>
        
        {/* Property Info */}
        <View style={styles.propertySection}>
          <View style={[styles.propertyImageContainer, { backgroundColor: theme.colors.divider }]}>
            {viewing.property.imageUrl ? (
              <Image 
                source={{ uri: viewing.property.imageUrl }} 
                style={styles.propertyImage} 
              />
            ) : (
              <Home size={24} color={theme.colors.textTertiary} />
            )}
          </View>
          <View style={styles.propertyInfo}>
            <Text 
              style={[styles.propertyTitle, { color: theme.colors.textPrimary }]}
              numberOfLines={1}
            >
              {viewing.property.title}
            </Text>
            <View style={styles.addressRow}>
              <MapPin size={12} color={theme.colors.textTertiary} />
              <Text 
                style={[styles.addressText, { color: theme.colors.textTertiary }]}
                numberOfLines={1}
              >
                {viewing.property.address}
              </Text>
            </View>
          </View>
        </View>
        
        {/* Contact */}
        <View style={styles.contactSection}>
          <View style={[styles.avatar, { backgroundColor: theme.colors.primary.light }]}>
            {contact.avatar ? (
              <Image source={{ uri: contact.avatar }} style={styles.avatarImage} />
            ) : (
              <User size={16} color="#fff" />
            )}
          </View>
          <Text style={[styles.contactName, { color: theme.colors.textSecondary }]}>
            {contact.name}
          </Text>
        </View>
      </View>
      
      {/* Actions */}
      {showActions && (viewing.status === 'pending' || viewing.status === 'confirmed') && (
        <View style={[styles.actions, { borderTopColor: theme.colors.divider }]}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: theme.colors.divider }]}
            onPress={onReschedule}
          >
            <RefreshCw size={16} color={theme.colors.textSecondary} />
            <Text style={[styles.actionText, { color: theme.colors.textSecondary }]}>
              Reprogramează
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#ef444420' }]}
            onPress={onCancel}
          >
            <XCircle size={16} color="#ef4444" />
            <Text style={[styles.actionText, { color: '#ef4444' }]}>
              Anulează
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    margin: 16,
    marginBottom: 0,
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    padding: 16,
    paddingTop: 12,
  },
  dateTimeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  timeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  dateBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 14,
  },
  propertySection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  propertyImageContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  propertyImage: {
    width: '100%',
    height: '100%',
  },
  propertyInfo: {
    flex: 1,
  },
  propertyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addressText: {
    fontSize: 13,
    flex: 1,
  },
  contactSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  contactName: {
    fontSize: 13,
  },
  actions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    padding: 12,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
  },
});

export default ViewingCard;
