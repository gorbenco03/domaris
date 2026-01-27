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
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@/app/providers/ThemeProvider';
import { ProfileStackParamList } from '@/app/navigation/types';
import { Viewing, STATUS_INFO } from '../types';
import { Button, IconButton } from '@/shared/components';
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
import {
  useViewing,
  useConfirmViewing,
  useRejectViewing,
  useCancelViewing,
  useSubmitViewingFeedback,
} from '../hooks/useViewings';

type ViewingDetailRouteProp = RouteProp<ProfileStackParamList, 'ViewingDetail'>;
type ViewingDetailNavigationProp = NativeStackNavigationProp<ProfileStackParamList, 'ViewingDetail'>;

const ViewingDetailScreen: React.FC = () => {
  const navigation = useNavigation<ViewingDetailNavigationProp>();
  const route = useRoute<ViewingDetailRouteProp>();
  const { theme } = useTheme();
  
  const { viewingId } = route.params;
  const { data: viewing, isLoading, error, refetch } = useViewing(viewingId);
  const confirmMutation = useConfirmViewing();
  const rejectMutation = useRejectViewing();
  const cancelMutation = useCancelViewing();
  const feedbackMutation = useSubmitViewingFeedback();
  
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [interested, setInterested] = useState<boolean>(true);
  
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary.main} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !viewing) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.colors.secondary.error }]}>
            Eroare la încărcarea vizionării
          </Text>
          <Button title="Încearcă din nou" onPress={() => refetch()} variant="outline" />
        </View>
      </SafeAreaView>
    );
  }

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
    if (viewing?.owner?.phone) {
      Linking.openURL(`tel:${viewing.owner.phone}`);
    }
  };
  
  const handleMessage = () => {
    // Navigate to chat
    if (viewing?.owner?.id) {
      // TODO: Navigate to chat with owner
      console.log('Navigate to chat with:', viewing.owner.id);
    }
  };
  
  const handleNavigate = () => {
    if (viewing?.property?.address) {
      const address = encodeURIComponent(viewing.property.address);
      Linking.openURL(`https://maps.google.com/?q=${address}`);
    }
  };
  
  const handleConfirm = () => {
    if (!viewing) return;
    confirmMutation.mutate(
      { id: viewing.id },
      {
        onSuccess: () => {
          Alert.alert('Succes', 'Vizionarea a fost confirmată');
        },
        onError: (error: any) => {
          Alert.alert('Eroare', error?.message || 'Nu s-a putut confirma vizionarea');
        },
      }
    );
  };

  const handleReject = () => {
    if (!viewing) return;
    Alert.prompt(
      'Respingere vizionare',
      'Introdu motivul respingerii:',
      [
        { text: 'Anulează', style: 'cancel' },
        {
          text: 'Respinge',
          style: 'destructive',
          onPress: (reason) => {
            if (reason) {
              rejectMutation.mutate(
                { id: viewing.id, reason },
                {
                  onSuccess: () => {
                    Alert.alert('Succes', 'Vizionarea a fost respinsă');
                  },
                  onError: (error: any) => {
                    Alert.alert('Eroare', error?.message || 'Nu s-a putut respinge vizionarea');
                  },
                }
              );
            }
          },
        },
      ],
      'plain-text'
    );
  };

  const handleReschedule = () => {
    if (!viewing) return;
    navigation.push('RequestViewing', {
      propertyId: viewing.propertyId,
      viewingId: viewing.id,
    });
  };
  
  const handleCancel = () => {
    if (!viewing) return;
    Alert.alert(
      'Anulare vizionare',
      'Ești sigur că dorești să anulezi această vizionare?',
      [
        { text: 'Nu', style: 'cancel' },
        {
          text: 'Da, anulează',
          style: 'destructive',
          onPress: () => {
            cancelMutation.mutate(
              { id: viewing.id },
              {
                onSuccess: () => {
                  Alert.alert('Succes', 'Vizionarea a fost anulată');
                },
                onError: (error: any) => {
                  Alert.alert('Eroare', error?.message || 'Nu s-a putut anula vizionarea');
                },
              }
            );
          },
        },
      ]
    );
  };
  
  const handleLeaveFeedback = () => {
    setShowFeedbackForm(true);
  };
  
  const handleSubmitFeedback = () => {
    if (!viewing || rating === 0) {
      Alert.alert('Atenție', 'Selectează o evaluare (1-5 stele)');
      return;
    }
    
    feedbackMutation.mutate(
      {
        id: viewing.id,
        rating,
        comment: comment || undefined,
        interested,
      },
      {
        onSuccess: () => {
          Alert.alert('Succes', 'Feedback-ul a fost trimis');
          setShowFeedbackForm(false);
          refetch();
        },
        onError: (error: any) => {
          Alert.alert('Eroare', error?.message || 'Nu s-a putut trimite feedback-ul');
        },
      }
    );
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
          <IconButton
            icon={<ArrowLeft size={22} color={theme.colors.textPrimary} />}
            onPress={() => {
              // Always go back to Viewings list
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                navigation.navigate('Viewings');
              }
            }}
            variant="surface"
            size="md"
            style={[
              styles.backButton,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
            ]}
          />
          
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
          {viewing.status === 'completed' && !viewing.seekerFeedback && !showFeedbackForm && (
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

          {/* Feedback Form */}
          {viewing.status === 'completed' && !viewing.seekerFeedback && showFeedbackForm && (
            <View style={[styles.section, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                Lasă feedback
              </Text>
              
              {/* Rating Stars */}
              <View style={styles.ratingContainer}>
                <Text style={[styles.ratingLabel, { color: theme.colors.textSecondary }]}>
                  Evaluare:
                </Text>
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                      key={star}
                      onPress={() => setRating(star)}
                      style={styles.starButton}
                    >
                      <Star
                        size={32}
                        color={star <= rating ? '#fbbf24' : theme.colors.divider}
                        fill={star <= rating ? '#fbbf24' : 'transparent'}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Comment */}
              <View style={[styles.commentContainer, { borderColor: theme.colors.border }]}>
                <TextInput
                  style={[styles.commentInput, { color: theme.colors.textPrimary }]}
                  placeholder="Comentariu (opțional)"
                  placeholderTextColor={theme.colors.textTertiary}
                  value={comment}
                  onChangeText={setComment}
                  multiline
                  numberOfLines={4}
                />
              </View>

              {/* Interested Checkbox */}
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setInterested(!interested)}
              >
                <View style={[
                  styles.checkbox,
                  { 
                    backgroundColor: interested ? theme.colors.primary.main : 'transparent',
                    borderColor: theme.colors.border,
                  }
                ]}>
                  {interested && <CheckCircle size={16} color="#fff" />}
                </View>
                <Text style={[styles.checkboxLabel, { color: theme.colors.textPrimary }]}>
                  Sunt încă interesat de această proprietate
                </Text>
              </TouchableOpacity>

              {/* Submit Buttons */}
              <View style={styles.feedbackActions}>
                <Button
                  title="Anulează"
                  onPress={() => setShowFeedbackForm(false)}
                  variant="outline"
                  style={styles.feedbackButton}
                />
                <Button
                  title="Trimite feedback"
                  onPress={handleSubmitFeedback}
                  variant="primary"
                  style={styles.feedbackButton}
                  loading={feedbackMutation.isPending}
                  disabled={rating === 0}
                />
              </View>
            </View>
          )}

          {/* Existing Feedback */}
          {viewing.seekerFeedback && (
            <View style={[styles.section, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                Feedback-ul tău
              </Text>
              <View style={styles.existingFeedback}>
                <View style={styles.feedbackRating}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={20}
                      color={star <= viewing.seekerFeedback!.rating ? '#fbbf24' : theme.colors.divider}
                      fill={star <= viewing.seekerFeedback!.rating ? '#fbbf24' : 'transparent'}
                    />
                  ))}
                </View>
                {viewing.seekerFeedback.comment && (
                  <Text style={[styles.feedbackComment, { color: theme.colors.textSecondary }]}>
                    {viewing.seekerFeedback.comment}
                  </Text>
                )}
                <Text style={[styles.feedbackInterested, { color: theme.colors.textTertiary }]}>
                  {viewing.seekerFeedback.interested ? 'Interesat' : 'Nu este interesat'}
                </Text>
              </View>
            </View>
          )}
          
          {/* Actions - Owner can confirm/reject pending viewings */}
          {viewing.status === 'pending' && viewing.isOwner && (
            <View style={styles.actions}>
              <Button
                title="Confirmă vizionarea"
                onPress={handleConfirm}
                variant="primary"
                fullWidth
                style={styles.actionButton}
                loading={confirmMutation.isPending}
              />
              <Button
                title="Respinge"
                onPress={handleReject}
                variant="outline"
                fullWidth
                style={styles.actionButton}
                loading={rejectMutation.isPending}
              />
            </View>
          )}

          {/* Actions - Seeker/Owner can reschedule/cancel confirmed viewings */}
          {(viewing.status === 'confirmed' || viewing.status === 'rescheduled') && (
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
                loading={cancelMutation.isPending}
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
    borderWidth: 1,
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  ratingContainer: {
    marginBottom: 20,
  },
  ratingLabel: {
    fontSize: 14,
    marginBottom: 12,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  starButton: {
    padding: 4,
  },
  commentContainer: {
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 16,
  },
  commentInput: {
    padding: 12,
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxLabel: {
    fontSize: 14,
    flex: 1,
  },
  feedbackActions: {
    flexDirection: 'row',
    gap: 12,
  },
  feedbackButton: {
    flex: 1,
  },
  existingFeedback: {
    marginTop: 8,
  },
  feedbackRating: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 12,
  },
  feedbackComment: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  feedbackInterested: {
    fontSize: 12,
  },
});

export default ViewingDetailScreen;
