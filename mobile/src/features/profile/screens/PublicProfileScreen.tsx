/**
 * IMOBI - Public Profile Screen
 * How other users see your profile
 */

import React, { useState, useCallback, useEffect } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
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
import { useAuth } from '@/app/providers/AuthProvider';
import { ProfileStackParamList } from '@/app/navigation/types';
import Button from '@/shared/components/Button';
import { PropertyCard, ScreenHeader } from '@/shared/components';
import { getPublicProfile, getUserListings, type IPublicUserProfile, type IUserListing } from '../api/userApi';
import { formatDate } from '@/shared/utils/formatters';

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
// HELPER FUNCTIONS
// ============================================

/**
 * Format memberSince date to Romanian format (e.g., "Decembrie 2024")
 */
const formatMemberSince = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('ro-RO', {
    month: 'long',
    year: 'numeric',
  }).format(dateObj);
};

/**
 * Parse location string to {city, county} object
 */
const parseLocation = (location?: string | null): { city: string; county: string } => {
  if (!location) {
    return { city: 'București', county: 'România' };
  }
  
  // Try to parse "City, County" format
  const parts = location.split(',').map(p => p.trim());
  if (parts.length >= 2) {
    return { city: parts[0], county: parts[1] };
  }
  
  return { city: parts[0] || 'București', county: 'România' };
};

/**
 * Map verification level and badges to UI badge format
 * Only show badge for level 3 (Proprietar Verificat)
 */
const mapBadges = (verificationLevel: number, backendBadges: string[]): Array<{
  id: string;
  name: string;
  icon: string;
  description: string;
}> => {
  const badges: Array<{ id: string; name: string; icon: string; description: string }> = [];
  
  // Only show badge for verification level 3
  if (verificationLevel >= 3) {
    badges.push({
      id: 'verified-owner',
      name: 'Proprietar Verificat',
      icon: '', // No emoji, will use icon component instead
      description: 'Proprietar verificat cu documente',
    });
  }
  
  return badges;
};

/**
 * Map backend user profile to UI format
 */
const mapUserProfile = (backendUser: IPublicUserProfile): PublicUser => {
  // Location is not included in public profile for privacy - use default
  const location = { city: 'București', county: 'România' };
  
  return {
    id: String(backendUser.id),
    firstName: backendUser.firstName,
    lastName: backendUser.lastName || '',
    avatar: backendUser.avatar,
    location,
    memberSince: formatMemberSince(backendUser.memberSince),
    isVerified: backendUser.isVerified,
    verificationLevel: backendUser.verificationLevel,
    stats: {
      activeListings: backendUser.activeListingsCount,
      totalSales: 0, // Not available from backend yet
      responseRate: 0, // Not available from backend yet
      responseTime: '', // Not available from backend yet
    },
    rating: {
      average: backendUser.rating || 0,
      count: backendUser.reviewsCount || 0,
    },
    badges: mapBadges(backendUser.verificationLevel, backendUser.badges || []),
    bio: backendUser.bio,
    languages: undefined, // Not available from backend
    specializations: undefined, // Not available from backend
  };
};

/**
 * Map backend listing to UI format
 */
const mapListing = (backendListing: IUserListing): PropertyListing => {
  const primaryImage = backendListing.images?.find(img => img.isPrimary) || backendListing.images?.[0];
  
  // Handle null/undefined transactionType - default to 'SALE'
  const transactionType = backendListing.transactionType 
    ? (backendListing.transactionType.toUpperCase() as 'SALE' | 'RENT')
    : 'SALE';
  
  return {
    id: String(backendListing.id),
    title: backendListing.title || 'Proprietate',
    transactionType,
    price: backendListing.priceEur || 0,
    currency: 'EUR',
    location: {
      city: backendListing.city || 'București',
      neighborhood: backendListing.neighborhood,
    },
    characteristics: {
      rooms: backendListing.rooms,
      bedrooms: backendListing.bedrooms,
      bathrooms: backendListing.bathrooms,
      totalArea: backendListing.surfaceSqm || 0,
    },
    image: primaryImage?.url || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400',
  };
};

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
      <BadgeCheck size={16} color={theme.colors.accent.main} />
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
  const { user: currentUser } = useAuth();
  
  // Get userId from route params
  const { userId } = route.params;

  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<PublicUser | null>(null);
  const [listings, setListings] = useState<PropertyListing[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);

  // Check if viewing own profile - redirect to Profile screen
  useEffect(() => {
    if (currentUser && String(currentUser.id) === String(userId)) {
      // This is the user's own profile, navigate back to Profile screen
      navigation.replace('Profile');
    }
  }, [currentUser, userId, navigation]);

  const fetchUserData = useCallback(async () => {
    if (!userId) {
      setError('ID utilizator invalid');
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      const [userData, listingsData] = await Promise.all([
        getPublicProfile(userId),
        getUserListings(userId),
      ]);

      setUser(mapUserProfile(userData));
      
      // Safely map listings with error handling for each item
      const mappedListings = listingsData
        .map((listing) => {
          try {
            return mapListing(listing);
          } catch (err) {
            console.error('Error mapping listing:', listing.id, err);
            return null;
          }
        })
        .filter((listing): listing is PropertyListing => listing !== null);
      
      setListings(mappedListings);
    } catch (err: any) {
      console.error('Error fetching user profile:', err);
      setError(err.response?.data?.message || 'Eroare la încărcarea profilului');
      if (err.response?.status === 404) {
        setError('Utilizatorul nu a fost găsit');
      }
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setIsLoading(true);
    fetchUserData();
  }, [fetchUserData]);

  const handleShare = async () => {
    if (!user) return;
    
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
    if (!user) return;
    navigation.navigate('Reviews' as any, { userId: user.id });
  };

  const handleFollow = () => {
    setIsFollowing(!isFollowing);
  };

  const handlePropertyPress = (propertyId: string) => {
    // Navigate to property detail - cross-tab navigation
    (navigation as any).navigate('SearchTab', {
      screen: 'PropertyDetail',
      params: { propertyId },
    });
  };

  // Loading state
  if (isLoading && !user) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        edges={['top']}
      >
        <ScreenHeader title="Profil" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary.main} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            Se încarcă...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error && !user) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        edges={['top']}
      >
        <ScreenHeader title="Profil" />
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.colors.textSecondary }]}>
            {error}
          </Text>
          <Button
            title="Încearcă din nou"
            onPress={fetchUserData}
            variant="primary"
            style={{ marginTop: 16 }}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      <ScreenHeader
        title="Profil"
        rightSlot={
          <TouchableOpacity style={styles.headerButton} onPress={handleShare}>
            <Share2 size={22} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={styles.scrollView}
        horizontal={false}
        contentContainerStyle={[styles.scrollContent, { width: '100%' }]}
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
              centerContent={true}
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
                  variant="list"
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
  headerButton: {
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
    paddingBottom: 40,
    width: '100%',
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  badgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    minWidth: 80,
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
    width: '100%',
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 60,
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
});

export default PublicProfileScreen;
