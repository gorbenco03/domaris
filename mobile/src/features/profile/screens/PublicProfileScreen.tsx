/**
 * IMOBI - Public Profile Screen
 * How other users see your profile
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Share,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Share2,
  Star,
  MapPin,
  Calendar,
  BadgeCheck,
  Shield,
  MessageCircle,
  Phone,
  Mail,
  Home,
  Eye,
  Users,
  Award,
  ChevronRight,
  Flag,
  Heart,
  Clock,
  CheckCircle,
} from 'lucide-react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme } from '@/app/providers/ThemeProvider';
import { ProfileStackParamList } from '@/app/navigation/types';
import Button from '@/shared/components/Button';
import { PropertyCard } from '@/features/properties/components';

// Route prop type
type PublicProfileRouteProp = RouteProp<ProfileStackParamList, 'PublicProfile'>;

// ============================================
// TYPES
// ============================================

type NavigationProp = NativeStackNavigationProp<ProfileStackParamList>;

interface PublicUser {
  id: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  location: {
    city: string;
    county: string;
  };
  memberSince: string;
  isVerified: boolean;
  verificationLevel: number;
  stats: {
    activeListings: number;
    totalSales: number;
    responseRate: number;
    responseTime: string;
  };
  rating: {
    average: number;
    count: number;
  };
  badges: Array<{
    id: string;
    name: string;
    icon: string;
    description: string;
  }>;
  bio?: string;
  languages?: string[];
  specializations?: string[];
}

interface PropertyListing {
  id: string;
  title: string;
  transactionType: 'SALE' | 'RENT';
  price: number;
  currency: 'EUR' | 'RON';
  location: {
    city: string;
    neighborhood?: string;
  };
  characteristics: {
    rooms?: number;
    bedrooms?: number;
    bathrooms?: number;
    totalArea: number;
  };
  image: string;
}

// ============================================
// MOCK DATA
// ============================================

const MOCK_USER: PublicUser = {
  id: 'user-123',
  firstName: 'Alexandru',
  lastName: 'Popescu',
  location: {
    city: 'București',
    county: 'Sector 1',
  },
  memberSince: 'Decembrie 2024',
  isVerified: true,
  verificationLevel: 3,
  stats: {
    activeListings: 5,
    totalSales: 23,
    responseRate: 95,
    responseTime: '< 1 oră',
  },
  rating: {
    average: 4.8,
    count: 47,
  },
  badges: [
    { id: 'top-seller', name: 'Top Seller', icon: '🏆', description: 'Peste 20 de tranzacții finalizate' },
    { id: 'fast-responder', name: 'Răspuns Rapid', icon: '⚡', description: 'Răspunde în mai puțin de 1 oră' },
    { id: 'verified', name: 'Verificat Complet', icon: '✅', description: 'Identitate și documente verificate' },
  ],
  bio: 'Proprietar cu experiență în piața imobiliară din București. Ofer consiliere și asistență completă pentru vânzare și închiriere.',
  languages: ['Română', 'Engleză'],
  specializations: ['Apartamente', 'Case', 'Spații comerciale'],
};

const MOCK_LISTINGS: PropertyListing[] = [
  {
    id: 'prop-1',
    title: 'Apartament 3 camere, Drumul Taberei',
    transactionType: 'SALE',
    price: 120000,
    currency: 'EUR',
    location: { city: 'București', neighborhood: 'Drumul Taberei' },
    characteristics: { rooms: 3, bedrooms: 2, bathrooms: 1, totalArea: 75 },
    image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400',
  },
  {
    id: 'prop-2',
    title: 'Casă 4 camere cu grădină',
    transactionType: 'SALE',
    price: 250000,
    currency: 'EUR',
    location: { city: 'București', neighborhood: 'Pipera' },
    characteristics: { rooms: 4, bedrooms: 3, bathrooms: 2, totalArea: 180 },
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400',
  },
  {
    id: 'prop-3',
    title: 'Garsonieră modernă centrală',
    transactionType: 'RENT',
    price: 450,
    currency: 'EUR',
    location: { city: 'București', neighborhood: 'Universitate' },
    characteristics: { rooms: 1, bathrooms: 1, totalArea: 35 },
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400',
  },
];

// ============================================
// VERIFICATION BADGE COMPONENT
// ============================================

interface VerificationBadgeProps {
  level: number;
}

const VerificationBadge: React.FC<VerificationBadgeProps> = ({ level }) => {
  const { theme } = useTheme();

  const getConfig = () => {
    switch (level) {
      case 1:
        return { label: 'Email Verificat', color: theme.colors.secondary.info };
      case 2:
        return { label: 'Identitate Verificată', color: theme.colors.accent.main };
      case 3:
        return { label: 'Verificat Complet', color: theme.colors.secondary.warning };
      default:
        return null;
    }
  };

  const config = getConfig();
  if (!config) return null;

  return (
    <View style={[styles.verificationBadge, { backgroundColor: config.color + '20' }]}>
      <BadgeCheck size={14} color={config.color} />
      <Text style={[styles.verificationText, { color: config.color }]}>{config.label}</Text>
    </View>
  );
};

// ============================================
// STAT CARD COMPONENT
// ============================================

interface StatItemProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
}

const StatItem: React.FC<StatItemProps> = ({ icon, value, label }) => {
  const { theme } = useTheme();

  return (
    <View style={styles.statItem}>
      <View style={[styles.statIconContainer, { backgroundColor: theme.colors.primary.main + '15' }]}>
        {icon}
      </View>
      <Text style={[styles.statValue, { color: theme.colors.textPrimary }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: theme.colors.textTertiary }]}>{label}</Text>
    </View>
  );
};

// ============================================
// BADGE CARD COMPONENT
// ============================================

interface BadgeCardProps {
  badge: PublicUser['badges'][0];
}

const BadgeCard: React.FC<BadgeCardProps> = ({ badge }) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.badgeCard, { backgroundColor: theme.colors.surface, ...theme.shadows.sm }]}>
      <Text style={styles.badgeIcon}>{badge.icon}</Text>
      <Text style={[styles.badgeName, { color: theme.colors.textPrimary }]}>{badge.name}</Text>
    </View>
  );
};

// ============================================
// MAIN SCREEN
// ============================================

const PublicProfileScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<PublicProfileRouteProp>();
  
  // Get userId from route params
  const { userId } = route.params;

  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  // In a real app, you would fetch user data based on userId
  // For now we use mock data but acknowledge the userId
  const [user] = useState<PublicUser>({ ...MOCK_USER, id: userId });
  const [listings] = useState<PropertyListing[]>(MOCK_LISTINGS);
  const [isFollowing, setIsFollowing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  }, []);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Vezi profilul lui ${user.firstName} ${user.lastName} pe IMOBI: https://imobi.ro/user/${user.id}`,
        title: `${user.firstName} ${user.lastName} - IMOBI`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleContact = () => {
    Alert.alert(
      'Contactează',
      'Alege metoda de contact',
      [
        { text: 'Anulează', style: 'cancel' },
        { text: 'Trimite mesaj', onPress: () => console.log('Navigate to chat') },
        { text: 'Sună', onPress: () => console.log('Call') },
      ]
    );
  };

  const handleReport = () => {
    Alert.alert(
      'Raportează profil',
      'Ești sigur că vrei să raportezi acest profil?',
      [
        { text: 'Anulează', style: 'cancel' },
        {
          text: 'Raportează',
          style: 'destructive',
          onPress: () => Alert.alert('Mulțumim', 'Raportul a fost trimis și va fi analizat.'),
        },
      ]
    );
  };

  const handleViewReviews = () => {
    navigation.navigate('Reviews' as any, { userId: user.id });
  };

  const handleFollow = () => {
    setIsFollowing(!isFollowing);
  };

  const handlePropertyPress = (propertyId: string) => {
    // Navigate to property detail
    console.log('Navigate to property', propertyId);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>
          Profil
        </Text>
        <TouchableOpacity style={styles.headerButton} onPress={handleShare}>
          <Share2 size={22} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>

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
        {/* Profile Header Card */}
        <LinearGradient
          colors={theme.gradients.primary as unknown as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.profileCard, { borderRadius: theme.borderRadius['2xl'] }]}
        >
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            <View style={styles.avatarLarge}>
              <Text style={styles.avatarLargeText}>
                {user.firstName.charAt(0)}{user.lastName.charAt(0)}
              </Text>
            </View>
            {user.isVerified && (
              <View style={[styles.verifiedBadgeOverlay, { backgroundColor: theme.colors.surface }]}>
                <CheckCircle size={24} color={theme.colors.accent.main} fill={theme.colors.surface} />
              </View>
            )}
          </View>

          {/* Name and info */}
          <Text style={styles.userName}>
            {user.firstName} {user.lastName}
          </Text>

          <VerificationBadge level={user.verificationLevel} />

          <View style={styles.locationRow}>
            <MapPin size={14} color="rgba(255,255,255,0.7)" />
            <Text style={styles.locationText}>
              {user.location.city}, {user.location.county}
            </Text>
          </View>

          <View style={styles.locationRow}>
            <Calendar size={14} color="rgba(255,255,255,0.7)" />
            <Text style={styles.locationText}>
              Membru din {user.memberSince}
            </Text>
          </View>

          {/* Rating */}
          <TouchableOpacity style={styles.ratingContainer} onPress={handleViewReviews}>
            <View style={styles.ratingStars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={16}
                  color={star <= user.rating.average ? '#FFD700' : 'rgba(255,255,255,0.3)'}
                  fill={star <= user.rating.average ? '#FFD700' : 'transparent'}
                />
              ))}
            </View>
            <Text style={styles.ratingText}>
              {user.rating.average.toFixed(1)} ({user.rating.count} recenzii)
            </Text>
            <ChevronRight size={16} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
        </LinearGradient>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[
              styles.followButton,
              {
                backgroundColor: isFollowing ? theme.colors.surface : theme.colors.primary.main,
                borderColor: theme.colors.primary.main,
              },
            ]}
            onPress={handleFollow}
          >
            <Heart
              size={18}
              color={isFollowing ? theme.colors.primary.main : '#fff'}
              fill={isFollowing ? theme.colors.primary.main : 'transparent'}
            />
            <Text
              style={[
                styles.followButtonText,
                { color: isFollowing ? theme.colors.primary.main : '#fff' },
              ]}
            >
              {isFollowing ? 'Urmărești' : 'Urmărește'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.contactButton, { backgroundColor: theme.colors.accent.main }]}
            onPress={handleContact}
          >
            <MessageCircle size={18} color="#fff" />
            <Text style={styles.contactButtonText}>Contactează</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Section */}
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
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
            Statistici
          </Text>
          <View style={styles.statsGrid}>
            <StatItem
              icon={<Home size={18} color={theme.colors.primary.main} />}
              value={user.stats.activeListings}
              label="Anunțuri active"
            />
            <StatItem
              icon={<Award size={18} color={theme.colors.primary.main} />}
              value={user.stats.totalSales}
              label="Tranzacții"
            />
            <StatItem
              icon={<MessageCircle size={18} color={theme.colors.primary.main} />}
              value={`${user.stats.responseRate}%`}
              label="Răspuns"
            />
            <StatItem
              icon={<Clock size={18} color={theme.colors.primary.main} />}
              value={user.stats.responseTime}
              label="Timp răspuns"
            />
          </View>
        </View>

        {/* Badges Section */}
        {user.badges.length > 0 && (
          <View style={styles.badgesSection}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
              Insigne
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.badgesScroll}
            >
              {user.badges.map((badge) => (
                <BadgeCard key={badge.id} badge={badge} />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Bio Section */}
        {user.bio && (
          <View
            style={[
              styles.bioCard,
              {
                backgroundColor: theme.colors.surface,
                borderRadius: theme.borderRadius.xl,
                ...theme.shadows.card,
              },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
              Despre
            </Text>
            <Text style={[styles.bioText, { color: theme.colors.textSecondary }]}>
              {user.bio}
            </Text>

            {user.languages && (
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: theme.colors.textTertiary }]}>
                  Limbi:
                </Text>
                <Text style={[styles.infoValue, { color: theme.colors.textSecondary }]}>
                  {user.languages.join(', ')}
                </Text>
              </View>
            )}

            {user.specializations && (
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: theme.colors.textTertiary }]}>
                  Specializări:
                </Text>
                <Text style={[styles.infoValue, { color: theme.colors.textSecondary }]}>
                  {user.specializations.join(', ')}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Active Listings */}
        <View style={styles.listingsSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
              Anunțuri active
            </Text>
            <TouchableOpacity>
              <Text style={[styles.viewAllText, { color: theme.colors.primary.main }]}>
                Vezi toate
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.listingsGrid}>
            {listings.map((listing) => (
              <View key={listing.id} style={styles.listingCardWrapper}>
                <PropertyCard
                  id={listing.id}
                  title={listing.title}
                  transactionType={listing.transactionType}
                  price={listing.price}
                  currency={listing.currency}
                  location={listing.location}
                  characteristics={listing.characteristics}
                  image={listing.image}
                  onPress={() => handlePropertyPress(listing.id)}
                  variant="compact"
                />
              </View>
            ))}
          </View>
        </View>

        {/* Report Section */}
        <TouchableOpacity
          style={[styles.reportSection, { borderColor: theme.colors.border }]}
          onPress={handleReport}
        >
          <Flag size={18} color={theme.colors.textTertiary} />
          <Text style={[styles.reportText, { color: theme.colors.textTertiary }]}>
            Raportează acest profil
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

// ============================================
// STYLES
// ============================================

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  profileCard: {
    padding: 24,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLargeText: {
    fontSize: 36,
    fontFamily: 'Inter-Bold',
    color: '#fff',
  },
  verifiedBadgeOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderRadius: 12,
    padding: 2,
    // backgroundColor applied dynamically with theme.colors.surface
  },
  userName: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    marginBottom: 8,
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
    marginBottom: 12,
  },
  verificationText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  locationText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255,255,255,0.8)',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
  },
  ratingStars: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#fff',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    marginBottom: 20,
  },
  followButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    gap: 8,
  },
  followButtonText: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  contactButtonText: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
    color: '#fff',
  },
  statsCard: {
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statItem: {
    width: '50%',
    alignItems: 'center',
    paddingVertical: 12,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginTop: 2,
  },
  badgesSection: {
    marginBottom: 16,
  },
  badgesScroll: {
    gap: 12,
  },
  badgeCard: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    minWidth: 80,
  },
  badgeIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  badgeName: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
    textAlign: 'center',
  },
  bioCard: {
    padding: 20,
    marginBottom: 16,
  },
  bioText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 22,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  infoLabel: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    marginRight: 8,
  },
  infoValue: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    flex: 1,
  },
  listingsSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  listingsGrid: {
    gap: 16,
    alignItems: 'center',
  },
  listingCardWrapper: {
    width: '100%',
  },
  reportSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    gap: 8,
  },
  reportText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
});

export default PublicProfileScreen;
