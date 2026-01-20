/**
 * IMOBI - Profile Screen
 * Main profile view showing user information and settings
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
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
  BadgeCheck,
  Sparkles,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme } from '@/app/providers/ThemeProvider';
import { useAuth } from '@/app/providers/AuthProvider';
import { ProfileStackParamList } from '@/app/navigation/types';
import {
  Avatar,
  ProfileMenuItem,
  ProfileSection,
  RatingBadge,
  StatCard,
} from '../components';
import { OwnerDashboardWidget } from '@/features/analytics';

// Initial dummy stats for the profile
const DUMMY_STATS = {
  activeListings: 5,
  monthlyViews: 234,
  monthlyContacts: 12,
  verificationLevel: 2,
  memberSince: 'Ianuarie 2026',
  rating: 4.8,
  reviewCount: 23,
};

type NavigationProp = NativeStackNavigationProp<ProfileStackParamList>;

const ProfileScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { user: storeUser, logout: authLogout } = useAuth();

  // If user is null (shouldn't happen on this screen theoretically), use a fallback or return null
  if (!storeUser) return null;

  const user = {
    ...storeUser,
    ...DUMMY_STATS,
    location: {
      city: 'Bucureşti',
      county: 'Sector 1',
    },
  };

  const getVerificationBadge = () => {
    switch (user.verificationLevel) {
      case 1:
        return { text: 'Email Verificat', color: theme.colors.secondary.info };
      case 2:
        return { text: 'Identitate Verificată', color: theme.colors.accent.main };
      case 3:
        return { text: 'Verificat Complet', color: theme.colors.secondary.warning };
      default:
        return null;
    }
  };

  const verificationBadge = getVerificationBadge();

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
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
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
            <Bell size={22} color={theme.colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('Settings')}
            style={[
              styles.headerIconButton,
              {
                backgroundColor: theme.colors.surface,
                borderRadius: theme.borderRadius.full,
              },
            ]}
          >
            <Settings size={22} color={theme.colors.textSecondary} />
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
                source={user.avatar}
                size="lg"
                verified={user.verificationLevel >= 2}
                showEditButton
                onEditPress={() => navigation.navigate('EditProfile')}
              />
              <TouchableOpacity
                onPress={() => navigation.navigate('EditProfile')}
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
                {user.firstName} {user.lastName}
              </Text>

              {verificationBadge && (
                <View
                  style={[
                    styles.verificationBadge,
                    {
                      backgroundColor: `${verificationBadge.color}25`,
                      borderRadius: theme.borderRadius.full,
                      paddingHorizontal: theme.spacing[3],
                      paddingVertical: theme.spacing[1],
                    },
                  ]}
                >
                  <BadgeCheck size={14} color={verificationBadge.color} />
                  <Text style={[styles.verificationText, { color: verificationBadge.color }]}>
                    {verificationBadge.text}
                  </Text>
                </View>
              )}

              <View style={styles.locationRow}>
                <MapPin size={14} color="rgba(255, 255, 255, 0.7)" />
                <Text style={styles.locationText}>
                  {user.location.city}, {user.location.county}
                </Text>
              </View>

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
            onPress={() => console.log('View reviews')}
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
              ACTIVITATE IMOBILIARĂ
            </Text>
            
            <OwnerDashboardWidget 
              onPressDetails={() => navigation.navigate('PropertyStats', { propertyId: 'prop-123' })} 
            />
            
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

        {/* Core Features Section */}
        <ProfileSection title="Activitate">
          <ProfileMenuItem
            icon={<Bell />}
            label="Notificări"
            description="Vezi ultimele noutăți"
            onPress={() => navigation.navigate('Notifications')}
          />
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
        </ProfileSection>

        {/* Menu Sections */}
        <ProfileSection title="Setări">
          <ProfileMenuItem
            icon={<Settings />}
            label="Preferințe notificări"
            description="Push, email, SMS"
            onPress={() => navigation.navigate('NotificationSettings')}
          />
          <ProfileMenuItem
            icon={<Shield />}
            label="Securitate"
            description="Parolă, 2FA, sesiuni"
            onPress={() => navigation.navigate('ChangePassword')}
          />
          <ProfileMenuItem
            icon={<BadgeCheck />}
            label="Verificare identitate"
            description={
              user.verificationLevel >= 2
                ? 'Verificat complet'
                : 'Finalizează verificarea'
            }
            onPress={() => navigation.navigate('VerificationHub')}
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
        <ProfileSection>
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
          IMOBI v1.0.0
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
});

export default ProfileScreen;
