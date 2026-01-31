/**
 * RIVA - Reviews Screen
 * Display and add user reviews with real API data
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Star,
  ThumbsUp,
  Flag,
  X,
  Award,
  CheckCircle,
} from 'lucide-react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useTheme } from '@/app/providers/ThemeProvider';
import { useAuth } from '@/app/providers/AuthProvider';
import { ProfileStackParamList } from '@/app/navigation/types';
import Button from '@/shared/components/Button';
import { EmptyState } from '@/shared/components/EmptyState';
import { ScreenHeader } from '@/shared/components';
import {
  useUserReviews,
  useUserReviewStats,
  useToggleReviewHelpful,
  useReportReview,
  useRespondToReview,
} from '../hooks/useReviews';
import { IReview, IReviewStats } from '../api/reviewsApi';

// ============================================
// TYPES
// ============================================

type ReviewsScreenRouteProp = RouteProp<ProfileStackParamList, 'Reviews'>;

// ============================================
// STAR RATING COMPONENT
// ============================================

interface StarRatingProps {
  rating: number;
  size?: number;
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
}

const StarRating: React.FC<StarRatingProps> = ({
  rating,
  size = 16,
  interactive = false,
  onRatingChange,
}) => {
  const { theme } = useTheme();

  return (
    <View style={styles.starContainer}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity
          key={star}
          disabled={!interactive}
          onPress={() => onRatingChange?.(star)}
          style={styles.starButton}
        >
          <Star
            size={size}
            color={star <= rating ? theme.colors.secondary.warning : theme.colors.border}
            fill={star <= rating ? theme.colors.secondary.warning : 'transparent'}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
};

// ============================================
// REVIEW CARD COMPONENT
// ============================================

interface ReviewCardProps {
  review: IReview;
  onHelpful: () => void;
  onReport: () => void;
  isHelpfulLoading?: boolean;
}

const ReviewCard: React.FC<ReviewCardProps> = ({
  review,
  onHelpful,
  onReport,
  isHelpfulLoading,
}) => {
  const { theme } = useTheme();

  const getTransactionLabel = () => {
    switch (review.transactionType) {
      case 'buyer': return 'Cumpărător';
      case 'seller': return 'Vânzător';
      case 'renter': return 'Chiriaș';
      case 'landlord': return 'Proprietar';
      default: return '';
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ro-RO', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <View
      style={[
        styles.reviewCard,
        {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.borderRadius.xl,
          ...theme.shadows.card,
        },
      ]}
    >
      {/* Header */}
      <View style={styles.reviewHeader}>
        <View style={styles.authorInfo}>
          <View
            style={[
              styles.avatarPlaceholder,
              { backgroundColor: theme.colors.primary.main + '20' },
            ]}
          >
            <Text style={[styles.avatarText, { color: theme.colors.primary.main }]}>
              {review.author?.name?.charAt(0) || '?'}
            </Text>
          </View>
          <View style={styles.authorDetails}>
            <View style={styles.authorNameRow}>
              <Text style={[styles.authorName, { color: theme.colors.textPrimary }]}>
                {review.author?.name || 'Utilizator'}
              </Text>
              {review.author?.isVerified && (
                <CheckCircle size={14} color={theme.colors.accent.main} />
              )}
            </View>
            <Text style={[styles.reviewMeta, { color: theme.colors.textTertiary }]}>
              {formatDate(review.date)}
              {review.transactionType && ` • ${getTransactionLabel()}`}
            </Text>
          </View>
        </View>
        <StarRating rating={review.rating} size={14} />
      </View>

      {/* Content */}
      {review.title && (
        <Text style={[styles.reviewTitle, { color: theme.colors.textPrimary }]}>
          {review.title}
        </Text>
      )}
      {review.content && (
        <Text style={[styles.reviewContent, { color: theme.colors.textSecondary }]}>
          {review.content}
        </Text>
      )}

      {/* Property reference */}
      {review.propertyTitle && (
        <View style={[styles.propertyRef, { backgroundColor: theme.colors.background }]}>
          <Text style={[styles.propertyRefText, { color: theme.colors.textTertiary }]}>
            {review.propertyTitle}
          </Text>
        </View>
      )}

      {/* Owner Response */}
      {review.response && (
        <View style={[styles.responseContainer, { backgroundColor: theme.colors.primary.main + '08' }]}>
          <Text style={[styles.responseLabel, { color: theme.colors.primary.main }]}>
            Răspunsul proprietarului:
          </Text>
          <Text style={[styles.responseContent, { color: theme.colors.textSecondary }]}>
            {review.response.content}
          </Text>
        </View>
      )}

      {/* Actions */}
      <View style={[styles.reviewActions, { borderTopColor: theme.colors.border }]}>
        <TouchableOpacity
          style={styles.helpfulButton}
          onPress={onHelpful}
          disabled={isHelpfulLoading}
        >
          {isHelpfulLoading ? (
            <ActivityIndicator size="small" color={theme.colors.primary.main} />
          ) : (
            <ThumbsUp
              size={16}
              color={review.isHelpful ? theme.colors.primary.main : theme.colors.textTertiary}
              fill={review.isHelpful ? theme.colors.primary.main : 'transparent'}
            />
          )}
          <Text
            style={[
              styles.helpfulText,
              { color: review.isHelpful ? theme.colors.primary.main : theme.colors.textSecondary },
            ]}
          >
            Util ({review.helpful})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.reportButton} onPress={onReport}>
          <Flag size={14} color={theme.colors.textTertiary} />
          <Text style={[styles.reportText, { color: theme.colors.textTertiary }]}>
            Raportează
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ============================================
// RESPOND MODAL
// ============================================

interface RespondModalProps {
  visible: boolean;
  reviewId: string;
  onClose: () => void;
  onSubmit: (response: string) => void;
  isLoading?: boolean;
}

const RespondModal: React.FC<RespondModalProps> = ({
  visible,
  onClose,
  onSubmit,
  isLoading,
}) => {
  const { theme } = useTheme();
  const [response, setResponse] = useState('');

  const handleSubmit = () => {
    if (response.length < 10) {
      Alert.alert('Eroare', 'Răspunsul trebuie să aibă cel puțin 10 caractere.');
      return;
    }
    onSubmit(response);
    setResponse('');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalContainer}
      >
        <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color={theme.colors.textSecondary} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>
              Răspunde la recenzie
            </Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.modalBody}>
            <TextInput
              style={[
                styles.textArea,
                {
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.textPrimary,
                  borderColor: theme.colors.border,
                },
              ]}
              value={response}
              onChangeText={setResponse}
              placeholder="Scrie răspunsul tău..."
              placeholderTextColor={theme.colors.textTertiary}
              multiline
              numberOfLines={5}
              maxLength={500}
              textAlignVertical="top"
            />
            <Text style={[styles.charCount, { color: theme.colors.textTertiary }]}>
              {response.length}/500
            </Text>
          </View>

          <View style={[styles.modalFooter, { borderTopColor: theme.colors.border }]}>
            <Button
              title="Trimite răspunsul"
              onPress={handleSubmit}
              disabled={response.length < 10}
              loading={isLoading}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ============================================
// MAIN SCREEN
// ============================================

const ReviewsScreen: React.FC = () => {
  const { theme } = useTheme();
  const route = useRoute<ReviewsScreenRouteProp>();
  const { user } = useAuth();

  const { userId: routeUserId, isOwnProfile: routeIsOwnProfile } = route.params || {};

  // Determine which user's reviews to show
  const targetUserId = routeUserId || (user?.id ? String(user.id) : undefined);
  const isOwnProfile = routeIsOwnProfile ?? (targetUserId === String(user?.id));

  const [filter, setFilter] = useState<'all' | 'positive' | 'negative'>('all');
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);
  const [helpfulLoadingId, setHelpfulLoadingId] = useState<string | null>(null);

  // API Queries
  const {
    data: reviewsData,
    isLoading: reviewsLoading,
    refetch: refetchReviews,
    isRefetching,
  } = useUserReviews(targetUserId, {
    minRating: filter === 'positive' ? 4 : filter === 'negative' ? 1 : undefined,
    maxRating: filter === 'positive' ? 5 : filter === 'negative' ? 2 : undefined,
  });

  const {
    data: stats,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useUserReviewStats(targetUserId);

  // Mutations
  const toggleHelpfulMutation = useToggleReviewHelpful();
  const reportMutation = useReportReview();
  const respondMutation = useRespondToReview();

  const reviews = reviewsData?.data || [];
  const isLoading = reviewsLoading || statsLoading;
  const refreshing = isRefetching;

  const onRefresh = useCallback(() => {
    refetchReviews();
    refetchStats();
  }, [refetchReviews, refetchStats]);

  const handleHelpful = async (reviewId: string) => {
    setHelpfulLoadingId(reviewId);
    try {
      await toggleHelpfulMutation.mutateAsync(reviewId);
    } finally {
      setHelpfulLoadingId(null);
    }
  };

  const handleReport = (reviewId: string) => {
    Alert.alert(
      'Raportează recenzia',
      'Ești sigur că vrei să raportezi această recenzie?',
      [
        { text: 'Anulează', style: 'cancel' },
        {
          text: 'Raportează',
          style: 'destructive',
          onPress: async () => {
            try {
              await reportMutation.mutateAsync({ reviewId, reason: 'Conținut inadecvat' });
              Alert.alert('Mulțumim', 'Recenzia a fost raportată și va fi verificată.');
            } catch (error) {
              Alert.alert('Eroare', 'Nu s-a putut raporta recenzia.');
            }
          },
        },
      ]
    );
  };

  const handleRespond = async (response: string) => {
    if (!selectedReviewId) return;
    try {
      await respondMutation.mutateAsync({ reviewId: selectedReviewId, response });
      setSelectedReviewId(null);
      Alert.alert('Succes', 'Răspunsul a fost publicat.');
      refetchReviews();
    } catch (error) {
      Alert.alert('Eroare', 'Nu s-a putut trimite răspunsul.');
    }
  };

  const getRatingColor = (average: number) => {
    if (average >= 4.5) return theme.colors.accent.main;
    if (average >= 3.5) return theme.colors.secondary.warning;
    if (average >= 2.5) return theme.colors.textSecondary;
    return theme.colors.secondary.error;
  };

  // Default stats if loading
  const displayStats: IReviewStats = stats || {
    average: 0,
    total: 0,
    distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    responseRate: 0,
  };

  if (isLoading && !reviews.length) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        edges={['top']}
      >
        <ScreenHeader title="Recenzii" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary.main} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      <ScreenHeader title="Recenzii" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary.main}
          />
        }
      >
        {/* Stats Card */}
        <View
          style={[
            styles.statsCard,
            {
              backgroundColor: theme.colors.surface,
              borderRadius: theme.borderRadius.xl,
              ...theme.shadows.card,
            },
          ]}
        >
          <View style={styles.statsMain}>
            <Text style={[styles.averageRating, { color: getRatingColor(displayStats.average) }]}>
              {displayStats.average.toFixed(1)}
            </Text>
            <StarRating rating={Math.round(displayStats.average)} size={20} />
            <Text style={[styles.totalReviews, { color: theme.colors.textSecondary }]}>
              {displayStats.total} recenzii
            </Text>
          </View>

          <View style={styles.statsDistribution}>
            {[5, 4, 3, 2, 1].map((star) => (
              <View key={star} style={styles.distributionRow}>
                <Text style={[styles.distributionLabel, { color: theme.colors.textTertiary }]}>
                  {star}
                </Text>
                <Star size={12} color={theme.colors.secondary.warning} fill={theme.colors.secondary.warning} />
                <View style={[styles.distributionBar, { backgroundColor: theme.colors.border }]}>
                  <View
                    style={[
                      styles.distributionFill,
                      {
                        width: displayStats.total > 0
                          ? `${(displayStats.distribution[star as keyof typeof displayStats.distribution] / displayStats.total) * 100}%`
                          : '0%',
                        backgroundColor: theme.colors.secondary.warning,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.distributionCount, { color: theme.colors.textSecondary }]}>
                  {displayStats.distribution[star as keyof typeof displayStats.distribution]}
                </Text>
              </View>
            ))}
          </View>

          {/* Response Rate */}
          <View style={[styles.responseRateSection, { borderTopColor: theme.colors.border }]}>
            <Award size={18} color={theme.colors.accent.main} />
            <Text style={[styles.responseRateText, { color: theme.colors.textSecondary }]}>
              Rata de răspuns: <Text style={{ color: theme.colors.accent.main, fontWeight: '600' }}>{displayStats.responseRate}%</Text>
            </Text>
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterTabs}>
          {[
            { id: 'all', label: 'Toate' },
            { id: 'positive', label: '4-5' },
            { id: 'negative', label: '1-2' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.filterTab,
                {
                  backgroundColor:
                    filter === tab.id ? theme.colors.primary.main : theme.colors.surface,
                  borderColor: filter === tab.id ? theme.colors.primary.main : theme.colors.border,
                },
              ]}
              onPress={() => setFilter(tab.id as typeof filter)}
            >
              <Star
                size={14}
                color={filter === tab.id ? '#fff' : theme.colors.secondary.warning}
                fill={filter === tab.id ? '#fff' : theme.colors.secondary.warning}
                style={{ marginRight: 4 }}
              />
              <Text
                style={[
                  styles.filterTabText,
                  { color: filter === tab.id ? '#fff' : theme.colors.textSecondary },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Reviews List */}
        {reviews.length > 0 ? (
          <View style={styles.reviewsList}>
            {reviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                onHelpful={() => handleHelpful(review.id)}
                onReport={() => handleReport(review.id)}
                isHelpfulLoading={helpfulLoadingId === review.id}
              />
            ))}
          </View>
        ) : (
          <EmptyState
            icon={<Star size={64} color={theme.colors.textTertiary} />}
            title="Nu există recenzii"
            message={
              filter !== 'all'
                ? 'Nu există recenzii care să corespundă filtrului selectat.'
                : 'Acest utilizator nu are încă recenzii.'
            }
          />
        )}
      </ScrollView>

      {/* Respond Modal */}
      <RespondModal
        visible={!!selectedReviewId}
        reviewId={selectedReviewId || ''}
        onClose={() => setSelectedReviewId(null)}
        onSubmit={handleRespond}
        isLoading={respondMutation.isPending}
      />
    </SafeAreaView>
  );
};

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  statsCard: {
    padding: 20,
    marginBottom: 16,
  },
  statsMain: {
    alignItems: 'center',
    marginBottom: 20,
  },
  averageRating: {
    fontSize: 48,
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  totalReviews: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginTop: 4,
  },
  statsDistribution: {
    gap: 8,
  },
  distributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  distributionLabel: {
    width: 12,
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
  distributionBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  distributionFill: {
    height: '100%',
    borderRadius: 4,
  },
  distributionCount: {
    width: 24,
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    textAlign: 'right',
  },
  responseRateSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  responseRateText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  filterTabs: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterTabText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  reviewsList: {
    gap: 16,
  },
  reviewCard: {
    padding: 16,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  authorDetails: {
    marginLeft: 12,
    flex: 1,
  },
  authorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  authorName: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
  },
  reviewMeta: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginTop: 2,
  },
  reviewTitle: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 6,
  },
  reviewContent: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
  propertyRef: {
    marginTop: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  propertyRefText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  responseContainer: {
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
  },
  responseLabel: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  responseContent: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    lineHeight: 18,
  },
  reviewActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  helpfulButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  helpfulText: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
  },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reportText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  starContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  starButton: {
    padding: 2,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    maxHeight: '90%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
  },
  modalBody: {
    padding: 20,
  },
  textArea: {
    height: 120,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    fontFamily: 'Inter-Regular',
  },
  charCount: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    textAlign: 'right',
    marginTop: 4,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
  },
});

export default ReviewsScreen;
