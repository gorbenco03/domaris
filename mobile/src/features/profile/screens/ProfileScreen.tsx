/**
 * RIVA - Profile Screen
 * Main profile view showing user information and settings
 */

import React, { useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Notifications from 'expo-notifications';
import {
  Edit3,
  Settings,
  Bell,
  Shield,
  Search,
  Home,
  Eye,
  Users,
  Calendar,
  FileText,
  HelpCircle,
  LogOut,
  ChevronRight,
  MapPin,
  Sparkles,
  CreditCard,
  Zap,
  Plus,
  Phone,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme } from '@/app/providers/ThemeProvider';
import { useAuth } from '@/app/providers/AuthProvider';
import { ProfileStackParamList } from '@/app/navigation/types';
import { useUserProfile } from '@/features/profile/services';
import { useOwnerAnalyticsSummary } from '@/features/analytics/services';
import { useUnreadCount } from '@/shared/services';
import { useMonetizationStatus } from '@/features/monetization/hooks/usePayments';
import { MONETIZATION_ENABLED } from '@/config/env';
// useRequireVerification removed - KYC no longer required
import {
  Avatar,
  ProfileMenuItem,
  ProfileSection,
  RatingBadge,
  StatCard,
} from '../components';

type NavigationProp = NativeStackNavigationProp<ProfileStackParamList>;

const ProfileScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { user: storeUser, logout: authLogout } = useAuth();
  // If user is null (shouldn't happen on this screen theoretically), use a fallback or return null
  if (!storeUser) return null;

  /* API Hooks */
  const { data: apiUser, isLoading, refetch: refetchUser } = useUserProfile();
  const { data: unreadData, refetch: refetchUnread } = useUnreadCount();
  const { summary, refetch: refetchSummary, isFetching: isFetchingSummary } = useOwnerAnalyticsSummary();
  const { canCreateListing, status: monetizationStatus } = useMonetizationStatus();
  const unreadCount = unreadData?.count || 0;
  const [isRefreshing, setIsRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        refetchUser?.(),
        refetchSummary?.(),
        refetchUnread?.(),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  }, [refetchUser, refetchSummary, refetchUnread]);

  // Debug: Get push token
  useEffect(() => {
    const getPushToken = async () => {
      try {
        console.log('🔔 Getting push token...');
        
        // Request permissions
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
          console.log('❌ Push notifications permission not granted');
          return;
        }

        // Get token
        const token = await Notifications.getExpoPushTokenAsync({
          projectId: '5986308b-82d0-4d84-af05-6e614efc3263',
        });

        console.log('✅ Push Token:', token.data);
        console.log('📋 Use this token to send test notifications:');
        console.log(`curl -X POST https://api.expo.dev/v2/push/send \\
  -H "Content-Type: application/json" \\
  -d '{
    "to": "${token.data}",
    "title": "Test Sprint 1",
    "body": "Notificare test RIVA"
  }'`);
        
      } catch (error) {
        console.error('❌ Error getting push token:', error);
      }
    };
    
    getPushToken();
  }, []);

  // Merge store user (auth context) with full profile details from API
  const user = {
    ...storeUser,
    ...apiUser,
    // Real data from extended profile
    location: apiUser?.city && apiUser?.country ? `${apiUser.city}, ${apiUser.country}` : apiUser?.location || '',
    bio: apiUser?.bio || '',
    phone: apiUser?.phone || '',
    address: apiUser?.address || '',
    // Stats (these come from the API user profile)
    activeListings: apiUser?.activeListingsCount || 0,
    monthlyViews: summary?.totalViews ?? 0,
    monthlyContacts: summary?.totalContacts ?? 0,
    reviewCount: apiUser?.reviewsCount || 0,
    rating: apiUser?.rating || 5.0,
    memberSince: apiUser?.createdAt ? new Date(apiUser.createdAt).toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' }) : 'Recent',
  };

  const handleLogout = async () => {
    try {
      await authLogout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      <ScrollView
        style={styles.scrollView}
        horizontal={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ width: '100%', flexGrow: 1, paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing || isFetchingSummary}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary.main}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text
            style={[
              styles.headerTitle,
              {
                color: theme.colors.textPrimary,
                fontSize: theme.typography.fontSize['3xl'],
              },
            ]}
          >
            Profil
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Notifications')}
            style={[
              styles.headerIconButton,
              {
                backgroundColor: theme.colors.surface,
                borderRadius: theme.borderRadius.full,
                marginRight: 10,
              },
            ]}
          >
            <View>
              <Bell size={22} color={theme.colors.textSecondary} />
              {unreadCount > 0 && (
                <View
                  style={{
                    position: 'absolute',
                    top: -2,
                    right: -2,
                    minWidth: 16,
                    height: 16,
                    backgroundColor: theme.colors.primary.main,
                    borderRadius: 8,
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderWidth: 1.5,
                    borderColor: theme.colors.surface,
                  }}
                >
                   {/* Optional: <Text style={{ fontSize: 8, color: 'white', fontWeight: 'bold' }}>{unreadCount}</Text> */} 
                   {/* Just a dot for bell, or number if space permits. The user asked for "apara in clopotel", implying an indicator. */}
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <View style={[styles.profileCardContainer, { marginHorizontal: theme.spacing[4] }]}>
          <LinearGradient
            colors={theme.gradients.primary as unknown as [string, string, ...string[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.profileCard,
              {
                borderRadius: theme.borderRadius['2xl'],
                padding: theme.spacing[5],
              },
            ]}
          >
            <View style={styles.profileCardHeader}>
              <Avatar
                firstName={user.firstName}
                lastName={user.lastName}
                source={user.avatar ?? undefined}
                size="lg"
                verified={false}
                showEditButton
                onEditPress={() => navigation.navigate('ProfileEdit')}
              />
              <TouchableOpacity
                onPress={() => navigation.navigate('ProfileEdit')}
                style={[
                  styles.editButton,
                  {
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: theme.borderRadius.lg,
                    paddingHorizontal: theme.spacing[3],
                    paddingVertical: theme.spacing[2],
                  },
                ]}
              >
                <Edit3 size={16} color="#ffffff" />
                <Text style={styles.editButtonText}>Editează</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.profileInfo}>
              <Text style={styles.userName}>
                {user.firstName} {user.lastName || ''}
              </Text>

              {user.location && (
                <View style={styles.locationRow}>
                  <MapPin size={14} color="rgba(255, 255, 255, 0.7)" />
                  <Text style={styles.locationText}>
                    {user.location}
                  </Text>
                </View>
              )}

              {user.phone && (
                <View style={styles.locationRow}>
                  <Phone size={14} color="rgba(255, 255, 255, 0.7)" />
                  <Text style={styles.locationText}>
                    {user.phone}
                  </Text>
                </View>
              )}

              {user.address && (
                <View style={styles.locationRow}>
                  <Home size={14} color="rgba(255, 255, 255, 0.7)" />
                  <Text style={styles.locationText}>
                    {user.address}
                  </Text>
                </View>
              )}

              <View style={styles.locationRow}>
                <Calendar size={14} color="rgba(255, 255, 255, 0.7)" />
                <Text style={styles.locationText}>
                  Membru din {user.memberSince}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Rating Card */}
        <View style={{ marginHorizontal: theme.spacing[4], marginTop: theme.spacing[4] }}>
          <RatingBadge
            rating={user.rating}
            reviewCount={user.reviewCount}
            onPress={() => navigation.navigate('Reviews', { isOwnProfile: true })}
          />
        </View>

        {/* Stats Section - Shown if user has activity */}
        {user.activeListings > 0 && (
          <View style={{ marginTop: theme.spacing[5], paddingHorizontal: theme.spacing[4] }}>
            <Text
              style={[
                styles.sectionTitle,
                {
                  color: theme.colors.textSecondary,
                  fontSize: theme.typography.fontSize.xs,
                  marginLeft: theme.spacing[1],
                  marginBottom: theme.spacing[3],
                },
              ]}
            >
              ACTIVITATE RIVALIARĂ
            </Text>
            <View style={[styles.statsRow, { marginTop: theme.spacing[2] }]}>
              <StatCard
                icon={<Home />}
                value={user.activeListings}
                label="Anunțuri"
                style={{ marginRight: theme.spacing[2] }}
              />
              <StatCard
                icon={<Eye />}
                value={user.monthlyViews}
                label="Vizualizări"
                style={{ marginHorizontal: theme.spacing[1] }}
              />
              <StatCard
                icon={<Users />}
                value={user.monthlyContacts}
                label="Contacte"
                style={{ marginLeft: theme.spacing[2] }}
              />
            </View>
          </View>
        )}

        {/* Add Property Action Card */}
        <View style={{ marginHorizontal: theme.spacing[4], marginTop: theme.spacing[4] }}>
          <TouchableOpacity
            onPress={() => {
              if (!canCreateListing) {
                Alert.alert(
                  'Limită atinsă',
                  `Ai atins limita de anunțuri active pentru contul tău. Contactează suportul la support@riva.md pentru mai multe informații.`,
                  [{ text: 'OK', style: 'cancel' }],
                );
                return;
              }
              navigation.navigate('CreateProperty');
            }}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[theme.colors.accent.main, theme.colors.accent.dark || theme.colors.accent.main]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                styles.addPropertyCard,
                { borderRadius: theme.borderRadius.xl }
              ]}
            >
              <View style={styles.addPropertyIcon}>
                <Plus size={28} color="#ffffff" strokeWidth={2.5} />
              </View>
              <View style={styles.addPropertyContent}>
                <Text style={styles.addPropertyTitle}>Adaugă anunț</Text>
                <Text style={styles.addPropertySubtitle}>
                  Publică o proprietate nouă
                </Text>
              </View>
              <ChevronRight size={24} color="rgba(255,255,255,0.7)" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Premium Section — hidden at v1 while monetization is OFF */}
        {MONETIZATION_ENABLED && (
          <ProfileSection title="Premium">
            <ProfileMenuItem
              icon={<Sparkles />}
              label="Planuri de abonament"
              description="Vezi toate beneficiile Premium"
              onPress={() => navigation.navigate('Pricing')}
            />
          </ProfileSection>
        )}

        {/* Core Features Section */}
        <ProfileSection title="Activitate">
          <ProfileMenuItem
            icon={<Home />}
            label="Proprietățile mele"
            description="Anunțuri postate și salvate"
            onPress={() => navigation.navigate('MyProperties')}
          />
          <ProfileMenuItem
            icon={<Calendar />}
            label="Vizionări"
            description="Programări și istoric"
            onPress={() => navigation.navigate('Viewings')}
          />
          <ProfileMenuItem
            icon={<FileText />}
            label="Contractele mele"
            description="Contracte de închiriere active și istorice"
            onPress={() => navigation.navigate('MyContracts')}
          />
        </ProfileSection>

        {/* Settings entry (single) */}
        <ProfileSection title="Setări">
          <ProfileMenuItem
            icon={<Settings />}
            label="Setări"
            description="Notificări, securitate, cont"
            onPress={() => navigation.navigate('Settings')}
          />
        </ProfileSection>

        <ProfileSection title="Legal">
          <ProfileMenuItem
            icon={<FileText />}
            label="Termeni și condiții"
            onPress={() => console.log('Terms')}
          />
          <ProfileMenuItem
            icon={<Shield />}
            label="Politica de confidențialitate"
            onPress={() => console.log('Privacy')}
          />
          <ProfileMenuItem
            icon={<HelpCircle />}
            label="Ajutor și suport"
            onPress={() => console.log('Help')}
          />
        </ProfileSection>

        {/* Logout Button */}
        <ProfileSection style={{ marginTop: theme.spacing[3] }}>
          <ProfileMenuItem
            icon={<LogOut />}
            label="Deconectare"
            onPress={handleLogout}
            danger
            showArrow={false}
          />
        </ProfileSection>

        {/* App Version */}
        <Text
          style={[
            styles.versionText,
            {
              color: theme.colors.textTertiary,
              fontSize: theme.typography.fontSize.xs,
              marginTop: theme.spacing[4],
            },
          ]}
        >
          RIVA v1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontWeight: '700',
  },
  headerIconButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileCardContainer: {},
  profileCard: {},
  profileCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  profileInfo: {
    marginTop: 16,
  },
  userName: {
    fontSize: 26,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  verificationText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  locationText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginLeft: 8,
  },
  sectionTitle: {
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  statsRow: {
    flexDirection: 'row',
  },
  versionText: {
    textAlign: 'center',
  },
  addPropertyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  addPropertyIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  addPropertyContent: {
    flex: 1,
  },
  addPropertyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 2,
  },
  addPropertySubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
  },
});

export default ProfileScreen;
