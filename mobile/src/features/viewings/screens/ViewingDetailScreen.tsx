/**
 * IMOBI - Viewing Detail Screen
 * Shows full details of a viewing appointment
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useTheme } from '@/app/providers/ThemeProvider';
import { ProfileStackParamList } from '@/app/navigation/types';
import { Viewing, STATUS_INFO } from '../types';
import { Button } from '@/shared/components';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Phone,
  MessageCircle,
  Home,
  User,
  Navigation,
  Star,
  RefreshCw,
  XCircle,
  CheckCircle,
} from 'lucide-react-native';

type ViewingDetailRouteProp = RouteProp<ProfileStackParamList, 'ViewingDetail'>;

// Mock viewing data
const MOCK_VIEWING: Viewing = {
  id: '1',
  propertyId: 'p1',
  ownerId: 'o1',
  seekerId: 's1',
  property: {
    id: 'p1',
    title: 'Apartament 3 camere modern',
    address: 'Str. Drumul Taberei 45, Sector 6, București',
    imageUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
    price: 120000,
  },
  owner: {
    id: 'o1',
    name: 'Ion Popescu',
    phone: '+40722123456',
    avatar: 'https://i.pravatar.cc/150?u=owner1',
  },
  seeker: {
    id: 's1',
    name: 'Maria Ionescu',
    phone: '+40733654321',
    avatar: 'https://i.pravatar.cc/150?u=seeker1',
  },
  requestedSlots: [
    { date: '2026-01-21', startTime: '10:00', endTime: '10:30' },
  ],
  confirmedSlot: { date: '2026-01-21', startTime: '10:00', endTime: '10:30' },
  duration: 30,
  status: 'confirmed',
  notes: 'Sunt foarte interesat de această proprietate. Aș dori să văd ambele dormitoare și balconul.',
  meetingPoint: 'La intrarea în bloc, la scara B',
  createdAt: new Date('2026-01-18'),
  confirmedAt: new Date('2026-01-19'),
};

const ViewingDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<ViewingDetailRouteProp>();
  const { theme } = useTheme();
  
  const [viewing] = useState<Viewing>(MOCK_VIEWING);
  
  const statusInfo = STATUS_INFO[viewing.status];
  const slot = viewing.confirmedSlot || viewing.requestedSlots[0];
  
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ro-RO', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ro-RO', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(price);
  };
  
  const handleCall = () => {
    if (viewing.owner.phone) {
      Linking.openURL(`tel:${viewing.owner.phone}`);
    }
  };
  
  const handleMessage = () => {
    // Navigate to chat
    console.log('Navigate to chat with:', viewing.owner.id);
  };
  
  const handleNavigate = () => {
    const address = encodeURIComponent(viewing.property.address);
    Linking.openURL(`https://maps.google.com/?q=${address}`);
  };
  
  const handleReschedule = () => {
    Alert.alert(
      'Reprogramare',
      'Dorești să reprogramezi această vizionare?',
      [
        { text: 'Anulează', style: 'cancel' },
        { text: 'Reprogramează', onPress: () => console.log('Reschedule') },
      ]
    );
  };
  
  const handleCancel = () => {
    Alert.alert(
      'Anulare vizionare',
      'Ești sigur că dorești să anulezi această vizionare?',
      [
        { text: 'Nu', style: 'cancel' },
        { text: 'Da, anulează', style: 'destructive', onPress: () => console.log('Cancel') },
      ]
    );
  };
  
  const handleLeaveFeedback = () => {
    console.log('Leave feedback');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header with Property Image */}
        <View style={styles.imageContainer}>
          {viewing.property.imageUrl ? (
            <Image source={{ uri: viewing.property.imageUrl }} style={styles.propertyImage} />
          ) : (
            <View style={[styles.placeholderImage, { backgroundColor: theme.colors.divider }]}>
              <Home size={48} color={theme.colors.textTertiary} />
            </View>
          )}
          
          {/* Back Button */}
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: theme.colors.surface }]}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          
          {/* Status Badge */}
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}>
            <Text style={styles.statusText}>{statusInfo.label}</Text>
          </View>
        </View>
        
        <View style={styles.content}>
          {/* Property Info */}
          <View style={[styles.section, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Text style={[styles.propertyTitle, { color: theme.colors.textPrimary }]}>
              {viewing.property.title}
            </Text>
            <View style={styles.addressRow}>
              <MapPin size={16} color={theme.colors.textSecondary} />
              <Text style={[styles.addressText, { color: theme.colors.textSecondary }]}>
                {viewing.property.address}
              </Text>
            </View>
            <Text style={[styles.priceText, { color: theme.colors.accent.main }]}>
              {formatPrice(viewing.property.price)}
            </Text>
          </View>
          
          {/* Date & Time */}
          <View style={[styles.section, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
              Data și ora vizionării
            </Text>
            
            <View style={styles.dateTimeRow}>
              <View style={[styles.dateTimeBox, { backgroundColor: theme.colors.primary.main }]}>
                <Calendar size={20} color="#fff" />
                <View>
                  <Text style={styles.dateTimeLabel}>Data</Text>
                  <Text style={styles.dateTimeValue}>
                    {formatDate(slot.date).charAt(0).toUpperCase() + formatDate(slot.date).slice(1)}
                  </Text>
                </View>
              </View>
              
              <View style={[styles.dateTimeBox, { backgroundColor: theme.colors.accent.main }]}>
                <Clock size={20} color="#fff" />
                <View>
                  <Text style={styles.dateTimeLabel}>Ora</Text>
                  <Text style={styles.dateTimeValue}>
                    {slot.startTime} - {slot.endTime}
                  </Text>
                </View>
              </View>
            </View>
          </View>
          
          {/* Meeting Point */}
          {viewing.meetingPoint && (
            <View style={[styles.section, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                Punct de întâlnire
              </Text>
              <View style={styles.meetingPointRow}>
                <MapPin size={18} color={theme.colors.accent.main} />
                <Text style={[styles.meetingPointText, { color: theme.colors.textSecondary }]}>
                  {viewing.meetingPoint}
                </Text>
              </View>
              <TouchableOpacity style={styles.navigateButton} onPress={handleNavigate}>
                <Navigation size={16} color={theme.colors.primary.main} />
                <Text style={[styles.navigateText, { color: theme.colors.primary.main }]}>
                  Deschide în Google Maps
                </Text>
              </TouchableOpacity>
            </View>
          )}
          
          {/* Contact */}
          <View style={[styles.section, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
              Proprietar
            </Text>
            
            <View style={styles.contactRow}>
              <View style={[styles.avatar, { backgroundColor: theme.colors.primary.light }]}>
                {viewing.owner.avatar ? (
                  <Image source={{ uri: viewing.owner.avatar }} style={styles.avatarImage} />
                ) : (
                  <User size={24} color="#fff" />
                )}
              </View>
              <View style={styles.contactInfo}>
                <Text style={[styles.contactName, { color: theme.colors.textPrimary }]}>
                  {viewing.owner.name}
                </Text>
                {viewing.owner.phone && (
                  <Text style={[styles.contactPhone, { color: theme.colors.textSecondary }]}>
                    {viewing.owner.phone}
                  </Text>
                )}
              </View>
            </View>
            
            <View style={styles.contactActions}>
              <TouchableOpacity
                style={[styles.contactButton, { backgroundColor: theme.colors.primary.main }]}
                onPress={handleCall}
              >
                <Phone size={18} color="#fff" />
                <Text style={styles.contactButtonText}>Sună</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.contactButton, { backgroundColor: theme.colors.accent.main }]}
                onPress={handleMessage}
              >
                <MessageCircle size={18} color="#fff" />
                <Text style={styles.contactButtonText}>Mesaj</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Notes */}
          {viewing.notes && (
            <View style={[styles.section, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                Notă adăugată
              </Text>
              <Text style={[styles.notesText, { color: theme.colors.textSecondary }]}>
                {viewing.notes}
              </Text>
            </View>
          )}
          
          {/* Feedback (for completed viewings) */}
          {viewing.status === 'completed' && !viewing.seekerFeedback && (
            <TouchableOpacity
              style={[styles.feedbackPrompt, { backgroundColor: theme.colors.secondary.main + '15' }]}
              onPress={handleLeaveFeedback}
            >
              <Star size={24} color={theme.colors.secondary.main} />
              <View style={styles.feedbackPromptText}>
                <Text style={[styles.feedbackTitle, { color: theme.colors.textPrimary }]}>
                  Cum a fost vizionarea?
                </Text>
                <Text style={[styles.feedbackHint, { color: theme.colors.textSecondary }]}>
                  Lasă un feedback pentru proprietar
                </Text>
              </View>
            </TouchableOpacity>
          )}
          
          {/* Actions */}
          {(viewing.status === 'pending' || viewing.status === 'confirmed') && (
            <View style={styles.actions}>
              <Button
                title="Reprogramează"
                onPress={handleReschedule}
                variant="outline"
                fullWidth
                style={styles.actionButton}
              />
              <Button
                title="Anulează vizionarea"
                onPress={handleCancel}
                variant="outline"
                fullWidth
                style={{ ...styles.actionButton, ...styles.cancelButton }}
                textStyle={{ color: '#ef4444' }}
              />
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  imageContainer: {
    height: 240,
    position: 'relative',
  },
  propertyImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusBadge: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    padding: 20,
  },
  section: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  propertyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 12,
  },
  addressText: {
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  priceText: {
    fontSize: 22,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateTimeBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    gap: 12,
  },
  dateTimeLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginBottom: 2,
  },
  dateTimeValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  meetingPointRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 12,
  },
  meetingPointText: {
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  navigateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  navigateText: {
    fontSize: 14,
    fontWeight: '500',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginRight: 14,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  contactPhone: {
    fontSize: 14,
  },
  contactActions: {
    flexDirection: 'row',
    gap: 12,
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  contactButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  notesText: {
    fontSize: 14,
    lineHeight: 22,
  },
  feedbackPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    gap: 14,
  },
  feedbackPromptText: {
    flex: 1,
  },
  feedbackTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  feedbackHint: {
    fontSize: 14,
  },
  actions: {
    marginTop: 8,
  },
  actionButton: {
    marginBottom: 12,
  },
  cancelButton: {
    borderColor: '#ef4444',
  },
});

export default ViewingDetailScreen;
