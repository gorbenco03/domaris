/**
 * IMOBI - Reviews Screen
 * Display and add user reviews
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
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Star,
  ThumbsUp,
  MessageCircle,
  Flag,
  Send,
  X,
  Filter,
  TrendingUp,
  Award,
  CheckCircle,
} from 'lucide-react-native';
import { useTheme } from '@/app/providers/ThemeProvider';
import Button from '@/shared/components/Button';
import { EmptyState } from '@/shared/components/EmptyState';
import { ScreenHeader } from '@/shared/components';

// ============================================
// TYPES
// ============================================

interface Review {
  id: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
    isVerified: boolean;
  };
  rating: number;
  title: string;
  content: string;
  date: string;
  helpful: number;
  isHelpful?: boolean;
  response?: {
    content: string;
    date: string;
  };
  transactionType?: 'buyer' | 'seller' | 'renter' | 'landlord';
  propertyTitle?: string;
}

interface ReviewStats {
  average: number;
  total: number;
  distribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  responseRate: number;
}

type ReviewsScreenParams = {
  userId?: string;
  isOwnProfile?: boolean;
};

// ============================================
// MOCK DATA
// ============================================

const MOCK_STATS: ReviewStats = {
  average: 4.7,
  total: 23,
  distribution: {
    5: 15,
    4: 5,
    3: 2,
    2: 1,
    1: 0,
  },
  responseRate: 87,
};

const MOCK_REVIEWS: Review[] = [
  {
    id: 'rev-1',
    author: {
      id: 'user-1',
      name: 'Maria Popescu',
      isVerified: true,
    },
    rating: 5,
    title: 'Experiență excelentă!',
    content: 'Am închiriat un apartament de la acest proprietar și totul a fost perfect. Comunicare rapidă, apartamentul exact ca în poze, foarte curat și bine întreținut. Recomand cu încredere!',
    date: '2026-01-15',
    helpful: 12,
    isHelpful: false,
    transactionType: 'renter',
    propertyTitle: 'Apartament 2 camere, Drumul Taberei',
    response: {
      content: 'Mulțumim pentru recenzie! Ne bucurăm că experiența a fost una plăcută. Succes în continuare!',
      date: '2026-01-16',
    },
  },
  {
    id: 'rev-2',
    author: {
      id: 'user-2',
      name: 'Andrei Ionescu',
      isVerified: true,
    },
    rating: 5,
    title: 'Proprietar de încredere',
    content: 'Am cumpărat o casă și întregul proces a fost transparent. Toate documentele în regulă, fără surprize neplăcute. Foarte profesionist!',
    date: '2026-01-10',
    helpful: 8,
    transactionType: 'buyer',
    propertyTitle: 'Casă 4 camere, Pipera',
  },
  {
    id: 'rev-3',
    author: {
      id: 'user-3',
      name: 'Elena Dumitrescu',
      isVerified: false,
    },
    rating: 4,
    title: 'Bun, dar puțin lent la răspuns',
    content: 'Apartamentul e foarte frumos și proprietarul a fost de treabă. Singura observație e că a durat câteva zile până am primit răspuns la întrebări. În rest, totul ok.',
    date: '2026-01-05',
    helpful: 4,
    transactionType: 'renter',
    propertyTitle: 'Garsonieră, Unirii',
  },
  {
    id: 'rev-4',
    author: {
      id: 'user-4',
      name: 'Bogdan Marinescu',
      isVerified: true,
    },
    rating: 5,
    title: 'Super experiență',
    content: 'Tranzacție rapidă și fără probleme. Proprietarul a fost foarte flexibil cu programul vizionărilor.',
    date: '2025-12-28',
    helpful: 6,
    transactionType: 'buyer',
  },
  {
    id: 'rev-5',
    author: {
      id: 'user-5',
      name: 'Cristina Popa',
      isVerified: true,
    },
    rating: 3,
    title: 'Experiență medie',
    content: 'Apartamentul era ok, dar au fost unele discrepanțe între poze și realitate. Comunicarea a fost bună totuși.',
    date: '2025-12-20',
    helpful: 2,
    transactionType: 'renter',
  },
];

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
  review: Review;
  onHelpful: () => void;
  onReport: () => void;
}

const ReviewCard: React.FC<ReviewCardProps> = ({ review, onHelpful, onReport }) => {
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
              {review.author.name.charAt(0)}
            </Text>
          </View>
          <View style={styles.authorDetails}>
            <View style={styles.authorNameRow}>
              <Text style={[styles.authorName, { color: theme.colors.textPrimary }]}>
                {review.author.name}
              </Text>
              {review.author.isVerified && (
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
      <Text style={[styles.reviewTitle, { color: theme.colors.textPrimary }]}>
        {review.title}
      </Text>
      <Text style={[styles.reviewContent, { color: theme.colors.textSecondary }]}>
        {review.content}
      </Text>

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
        <TouchableOpacity style={styles.helpfulButton} onPress={onHelpful}>
          <ThumbsUp
            size={16}
            color={review.isHelpful ? theme.colors.primary.main : theme.colors.textTertiary}
            fill={review.isHelpful ? theme.colors.primary.main : 'transparent'}
          />
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
// ADD REVIEW MODAL
// ============================================

interface AddReviewModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (review: { rating: number; title: string; content: string }) => void;
}

const AddReviewModal: React.FC<AddReviewModalProps> = ({ visible, onClose, onSubmit }) => {
  const { theme } = useTheme();
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const handleSubmit = () => {
    if (rating === 0) {
      Alert.alert('Eroare', 'Te rugăm să selectezi un rating.');
      return;
    }
    if (title.length < 5) {
      Alert.alert('Eroare', 'Titlul trebuie să aibă cel puțin 5 caractere.');
      return;
    }
    if (content.length < 20) {
      Alert.alert('Eroare', 'Recenzia trebuie să aibă cel puțin 20 de caractere.');
      return;
    }

    onSubmit({ rating, title, content });
    setRating(0);
    setTitle('');
    setContent('');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalContainer}
      >
        <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
          {/* Modal Header */}
          <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color={theme.colors.textSecondary} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>
              Scrie o recenzie
            </Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.modalBody}>
            {/* Rating */}
            <View style={styles.ratingSection}>
              <Text style={[styles.inputLabel, { color: theme.colors.textPrimary }]}>
                Rating general *
              </Text>
              <StarRating rating={rating} size={32} interactive onRatingChange={setRating} />
              <Text style={[styles.ratingHint, { color: theme.colors.textSecondary }]}>
                {rating === 0 && 'Selectează un rating'}
                {rating === 1 && 'Foarte slab'}
                {rating === 2 && 'Slab'}
                {rating === 3 && 'Satisfăcător'}
                {rating === 4 && 'Bun'}
                {rating === 5 && 'Excelent'}
              </Text>
            </View>

            {/* Title */}
            <View style={styles.inputSection}>
              <Text style={[styles.inputLabel, { color: theme.colors.textPrimary }]}>
                Titlu recenzie *
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.surface,
                    color: theme.colors.textPrimary,
                    borderColor: theme.colors.border,
                  },
                ]}
                value={title}
                onChangeText={setTitle}
                placeholder="Ex: Experiență excelentă!"
                placeholderTextColor={theme.colors.textTertiary}
                maxLength={100}
              />
            </View>

            {/* Content */}
            <View style={styles.inputSection}>
              <Text style={[styles.inputLabel, { color: theme.colors.textPrimary }]}>
                Recenzia ta *
              </Text>
              <TextInput
                style={[
                  styles.textArea,
                  {
                    backgroundColor: theme.colors.surface,
                    color: theme.colors.textPrimary,
                    borderColor: theme.colors.border,
                  },
                ]}
                value={content}
                onChangeText={setContent}
                placeholder="Descrie experiența ta în detaliu..."
                placeholderTextColor={theme.colors.textTertiary}
                multiline
                numberOfLines={5}
                maxLength={500}
                textAlignVertical="top"
              />
              <Text style={[styles.charCount, { color: theme.colors.textTertiary }]}>
                {content.length}/500
              </Text>
            </View>
          </ScrollView>

          {/* Submit Button */}
          <View style={[styles.modalFooter, { borderTopColor: theme.colors.border }]}>
            <Button
              title="Publică recenzia"
              onPress={handleSubmit}
              disabled={rating === 0 || title.length < 5 || content.length < 20}
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

  const [refreshing, setRefreshing] = useState(false);
  const [reviews, setReviews] = useState<Review[]>(MOCK_REVIEWS);
  const [stats, setStats] = useState<ReviewStats>(MOCK_STATS);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'positive' | 'negative'>('all');

  const isOwnProfile = true; // This would come from route params

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  }, []);

  const filteredReviews = reviews.filter((review) => {
    if (filter === 'positive') return review.rating >= 4;
    if (filter === 'negative') return review.rating <= 2;
    return true;
  });

  const handleHelpful = (reviewId: string) => {
    setReviews((prev) =>
      prev.map((r) =>
        r.id === reviewId
          ? {
              ...r,
              isHelpful: !r.isHelpful,
              helpful: r.isHelpful ? r.helpful - 1 : r.helpful + 1,
            }
          : r
      )
    );
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
          onPress: () => Alert.alert('Mulțumim', 'Recenzia a fost raportată și va fi verificată.'),
        },
      ]
    );
  };

  const handleAddReview = (review: { rating: number; title: string; content: string }) => {
    const newReview: Review = {
      id: `rev-${Date.now()}`,
      author: {
        id: 'current-user',
        name: 'Eu',
        isVerified: true,
      },
      rating: review.rating,
      title: review.title,
      content: review.content,
      date: new Date().toISOString().split('T')[0],
      helpful: 0,
    };

    setReviews((prev) => [newReview, ...prev]);
    setShowAddModal(false);
    Alert.alert('Succes!', 'Recenzia ta a fost publicată.');
  };

  const getRatingColor = (average: number) => {
    if (average >= 4.5) return theme.colors.accent.main;
    if (average >= 3.5) return theme.colors.secondary.warning;
    if (average >= 2.5) return theme.colors.textSecondary;
    return theme.colors.secondary.error;
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      <ScreenHeader
        title="Recenzii"
        rightSlot={
          !isOwnProfile ? (
            <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
              <MessageCircle size={22} color={theme.colors.primary.main} />
            </TouchableOpacity>
          ) : undefined
        }
      />

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
            <Text style={[styles.averageRating, { color: getRatingColor(stats.average) }]}>
              {stats.average.toFixed(1)}
            </Text>
            <StarRating rating={Math.round(stats.average)} size={20} />
            <Text style={[styles.totalReviews, { color: theme.colors.textSecondary }]}>
              {stats.total} recenzii
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
                        width: `${(stats.distribution[star as keyof typeof stats.distribution] / stats.total) * 100}%`,
                        backgroundColor: theme.colors.secondary.warning,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.distributionCount, { color: theme.colors.textSecondary }]}>
                  {stats.distribution[star as keyof typeof stats.distribution]}
                </Text>
              </View>
            ))}
          </View>

          {/* Response Rate */}
          <View style={[styles.responseRateSection, { borderTopColor: theme.colors.border }]}>
            <Award size={18} color={theme.colors.accent.main} />
            <Text style={[styles.responseRateText, { color: theme.colors.textSecondary }]}>
              Rata de răspuns: <Text style={{ color: theme.colors.accent.main, fontWeight: '600' }}>{stats.responseRate}%</Text>
            </Text>
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterTabs}>
          {[
            { id: 'all', label: 'Toate' },
            { id: 'positive', label: '⭐ 4-5' },
            { id: 'negative', label: '⭐ 1-2' },
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
        {filteredReviews.length > 0 ? (
          <View style={styles.reviewsList}>
            {filteredReviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                onHelpful={() => handleHelpful(review.id)}
                onReport={() => handleReport(review.id)}
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

      {/* Add Review Button (for other profiles) */}
      {!isOwnProfile && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: theme.colors.primary.main, ...theme.shadows.lg }]}
          onPress={() => setShowAddModal(true)}
        >
          <Send size={24} color="#fff" />
        </TouchableOpacity>
      )}

      {/* Add Review Modal */}
      <AddReviewModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddReview}
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
  addButton: {
    width: 44,
    height: 44,
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
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
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
  ratingSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  ratingHint: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginTop: 12,
  },
  inputSection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    fontFamily: 'Inter-Regular',
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
