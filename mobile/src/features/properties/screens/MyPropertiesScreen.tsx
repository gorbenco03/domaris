/**
 * RIVA - My Properties Screen
 * Lists all properties owned by the user with filtering and management options
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Plus,
  Home,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  Edit3,
  Trash2,
  BarChart2,
  Zap,
  MoreHorizontal,
  Filter,
  ShieldCheck,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme } from '@/app/providers/ThemeProvider';
import { useAuth } from '@/app/providers/AuthProvider';
import { ProfileStackParamList } from '@/app/navigation/types';
import Button from '@/shared/components/Button';
import { EmptyState } from '@/shared/components/EmptyState';
import { AuthRequiredScreen, ScreenHeader } from '@/shared/components';
import {
  useMyProperties,
  useDeleteProperty,
  useUpdatePropertyStatus
} from '@/features/properties/services';
import { useMonetizationStatus } from '@/features/monetization/hooks/usePayments';
import { MONETIZATION_ENABLED } from '@/config/env';
import { ActivityIndicator } from 'react-native';
import { IPropertyListItem } from '@/core/api/types';

// ============================================
// TYPES
// ============================================

type NavigationProp = NativeStackNavigationProp<ProfileStackParamList>;

type FilterTab = 'all' | 'active' | 'draft' | 'expired';

const FILTER_TABS: { id: FilterTab; label: string }[] = [
  { id: 'all', label: 'Toate' },
  { id: 'active', label: 'Active' },
  { id: 'draft', label: 'Ciorne' },
  { id: 'expired', label: 'Expirate' },
];

// ============================================
// PROPERTY CARD COMPONENT
// ============================================

interface ExtendedPropertyListItem extends IPropertyListItem {
  priceEur?: number;
  images?: any[]; // Backend sends images
  photos?: any[]; // Legacy fallback
  isBoosted?: boolean;
  viewsCount?: number;
  leadsCount?: number;
}

interface PropertyListItemProps {
  property: ExtendedPropertyListItem;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onStats: () => void;
  onBoost: () => void;
}

const PropertyListItem: React.FC<PropertyListItemProps> = ({
  property,
  onPress,
  onEdit,
  onDelete,
  onStats,
  onBoost,
}) => {
  const { theme } = useTheme();
  const [showActions, setShowActions] = useState(false);

  const getStatusConfig = (status: string) => {
    // Backend returns lowercase statuses: new | early_access | public | rented | hidden | expired
    switch ((status || '').toLowerCase()) {
      case 'public':
        return { label: 'Activ', color: theme.colors.accent.main, icon: CheckCircle };
      case 'new':
      case 'early_access':
        return { label: 'În verificare', color: theme.colors.secondary.warning, icon: Clock };
      case 'expired':
        return { label: 'Expirat', color: theme.colors.secondary.error, icon: AlertCircle };
      case 'rented':
        return { label: 'Închiriat', color: theme.colors.primary.main, icon: CheckCircle };
      case 'hidden':
        return { label: 'Ascuns', color: theme.colors.textTertiary, icon: FileText };
      default:
        return { label: 'Necunoscut', color: theme.colors.textTertiary, icon: FileText };
    }
  };

  const formatPrice = (value: number, currency: string, type: string) => {
    const formatted = value.toLocaleString('ro-RO');
    const suffix = type === 'RENT' ? '/lună' : '';
    return `${formatted} ${currency === 'EUR' ? '€' : 'RON'}${suffix}`;
  };

  const statusConfig = getStatusConfig(property.status);
  const StatusIcon = statusConfig.icon;

  return (
    <TouchableOpacity
      style={[
        styles.propertyCard,
        {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.borderRadius.xl,
          ...theme.shadows.card,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Image */}
      <View style={styles.cardImageContainer}>
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.6)']}
          style={styles.cardImageOverlay}
        />
        {((property.images && property.images.length > 0) || (property.photos && property.photos.length > 0)) ? (
          <Image source={{ uri: (property.images?.[0]?.url || property.photos?.[0]?.url) }} style={styles.cardImage} />
        ) : (
          <View style={[styles.cardImage, { backgroundColor: theme.colors.border }]}>
            <Home size={40} color={theme.colors.textTertiary} />
          </View>
        )}

        {/* Status Badge */}
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: `${statusConfig.color}20` },
          ]}
        >
          <StatusIcon size={12} color={statusConfig.color} />
          <Text style={[styles.statusText, { color: statusConfig.color }]}>
            {statusConfig.label}
          </Text>
        </View>

        {/* Boost Badge */}
        {property.isBoosted && (
          <View style={[styles.boostBadge, { backgroundColor: theme.colors.secondary.warning }]}>
            <Zap size={12} color="#fff" fill="#fff" />
            <Text style={styles.boostText}>Boost</Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.cardContent}>
        <Text
          style={[styles.cardTitle, { color: theme.colors.textPrimary }]}
          numberOfLines={2}
        >
          {property.title}
        </Text>

        <Text style={[styles.cardPrice, { color: theme.colors.primary.main }]}>
          {formatPrice(property.priceEur || property.price || 0, property.currency, property.transactionType)}
        </Text>

        <Text style={[styles.cardLocation, { color: theme.colors.textSecondary }]}>
          {property.neighborhood ? `${property.neighborhood}, ${property.city}` : property.city}
        </Text>

        {/* Ownership verification badge */}
        {(property as any).ownershipStatus && (property as any).ownershipStatus !== 'none' && (
          <View style={[
            styles.ownershipBadge,
            {
              backgroundColor: (property as any).ownershipStatus === 'verified'
                ? theme.colors.accent.main + '15'
                : (property as any).ownershipStatus === 'pending'
                ? theme.colors.secondary.warning + '15'
                : theme.colors.secondary.error + '15',
            },
          ]}>
            <ShieldCheck
              size={14}
              color={
                (property as any).ownershipStatus === 'verified'
                  ? theme.colors.accent.main
                  : (property as any).ownershipStatus === 'pending'
                  ? theme.colors.secondary.warning
                  : theme.colors.secondary.error
              }
            />
            <Text style={[
              styles.ownershipBadgeText,
              {
                color: (property as any).ownershipStatus === 'verified'
                  ? theme.colors.accent.main
                  : (property as any).ownershipStatus === 'pending'
                  ? theme.colors.secondary.warning
                  : theme.colors.secondary.error,
              },
            ]}>
              {(property as any).ownershipStatus === 'verified'
                ? 'Proprietate verificată'
                : (property as any).ownershipStatus === 'pending'
                ? 'Verificare în curs'
                : 'Verificare respinsă'}
            </Text>
          </View>
        )}

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Eye size={14} color={theme.colors.textTertiary} />
            <Text style={[styles.statText, { color: theme.colors.textSecondary }]}>
              {property.viewsCount || 0}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statDot, { color: theme.colors.textTertiary }]}>•</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statText, { color: theme.colors.textSecondary }]}>
              {property.leadsCount || 0} contacte
            </Text>
          </View>
        </View>

        {/* Actions Row */}
        <View style={[styles.actionsRow, { borderTopColor: theme.colors.divider }]}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.colors.primary.main + '15' }]}
            onPress={onEdit}
          >
            <Edit3 size={16} color={theme.colors.primary.main} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.colors.secondary.info + '15' }]}
            onPress={onStats}
          >
            <BarChart2 size={16} color={theme.colors.secondary.info} />
          </TouchableOpacity>

          {MONETIZATION_ENABLED && (property.status || '').toLowerCase() === 'public' && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.colors.secondary.warning + '15' }]}
              onPress={onBoost}
            >
              <Zap size={16} color={theme.colors.secondary.warning} />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.colors.secondary.error + '15' }]}
            onPress={onDelete}
          >
            <Trash2 size={16} color={theme.colors.secondary.error} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ============================================
// MAIN SCREEN
// ============================================

const MyPropertiesScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { isAuthenticated, user } = useAuth();

  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [refreshing, setRefreshing] = useState(false);

  // Real data fetching - no verification level required
  const { data: properties = [], isLoading, refetch, error } = useMyProperties(isAuthenticated);
  const deleteMutation = useDeleteProperty();
  const { status: monetizationStatus, canCreateListing } = useMonetizationStatus();

  if (!isAuthenticated) {
    return (
      <AuthRequiredScreen message="Autentifică-te pentru a vedea anunțurile tale." />
    );
  }

  const filteredProperties = properties.filter((p) => {
    if (!p.status) return true; // Safety
    // Backend statuses are lowercase: new | early_access | public | rented | hidden | expired
    const status = p.status.toLowerCase();
    if (activeFilter === 'all') return true;
    if (activeFilter === 'active') return status === 'public' || status === 'new' || status === 'early_access';
    if (activeFilter === 'draft') return status === 'new' || status === 'early_access';
    if (activeFilter === 'expired') return status === 'expired';
    return true;
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);



  const handlePropertyPress = (propertyId: string, property?: ExtendedPropertyListItem) => {
    navigation.navigate('EditProperty', { propertyId, property });
  };

  const handleEdit = (propertyId: string, property?: ExtendedPropertyListItem) => {
    navigation.navigate('EditProperty', { propertyId, property });
  };

  const handleDelete = (propertyId: string) => {
    Alert.alert(
      'Șterge anunț',
      'Ești sigur că vrei să ștergi acest anunț? Acțiunea este ireversibilă.',
      [
        { text: 'Anulează', style: 'cancel' },
        {
          text: 'Șterge',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMutation.mutateAsync(propertyId);
            } catch (error) {
              Alert.alert('Eroare', 'Nu s-a putut șterge anunțul.');
            }
          },
        },
      ]
    );
  };

  const handleStats = (propertyId: string) => {
    navigation.navigate('PropertyStats', { propertyId });
  };

  const handleBoost = (propertyId: string) => {
    if (!MONETIZATION_ENABLED) return; // Boost disabled at v1
    navigation.navigate('BoostPurchase', { propertyId });
  };

  const handleAddProperty = () => {
    if (!canCreateListing) {
      Alert.alert(
        'Limită atinsă',
        'Ai atins limita de anunțuri active. Contactează suportul la support@riva.md pentru mai multe informații.',
        [
          { text: 'OK', style: 'cancel' },
        ],
      );
      return;
    }
    navigation.navigate('CreateProperty');
  };

  const statusOf = (p: (typeof properties)[number]) => (p.status || '').toLowerCase();
  const stats = {
    total: properties.length,
    active: properties.filter((p) => statusOf(p) === 'public').length,
    drafts: properties.filter((p) => ['new', 'early_access'].includes(statusOf(p))).length,
    expired: properties.filter((p) => statusOf(p) === 'expired').length,
  };

  const listHeader = (
    <>
      {/* Stats Summary */}
      <View style={styles.summaryContainer}>
        <LinearGradient
          colors={theme.gradients.primary as unknown as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.summaryCard, { borderRadius: theme.borderRadius.xl }]}
        >
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{stats.total}</Text>
              <Text style={styles.summaryLabel}>Total</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{stats.active}</Text>
              <Text style={styles.summaryLabel}>Active</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{stats.drafts}</Text>
              <Text style={styles.summaryLabel}>Ciorne</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{stats.expired}</Text>
              <Text style={styles.summaryLabel}>Expirate</Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Quota Banner — only shown when monetization is enabled */}
      {MONETIZATION_ENABLED && monetizationStatus && (
        <View style={styles.quotaBannerContainer}>
          <View
            style={[
              styles.quotaBanner,
              {
                backgroundColor: canCreateListing
                  ? theme.colors.primary.main + '10'
                  : theme.colors.secondary.warning + '15',
                borderColor: canCreateListing
                  ? theme.colors.primary.main + '30'
                  : theme.colors.secondary.warning + '40',
              },
            ]}
          >
            <Text
              style={[
                styles.quotaText,
                {
                  color: canCreateListing
                    ? theme.colors.textSecondary
                    : theme.colors.secondary.warning,
                },
              ]}
            >
              {properties.length}/{monetizationStatus.capabilities?.maxActiveListings === 999 ? '∞' : monetizationStatus.capabilities?.maxActiveListings || 1} anunțuri active
            </Text>
          </View>
        </View>
      )}

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
        >
          {FILTER_TABS.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.filterTab,
                {
                  backgroundColor:
                    activeFilter === tab.id
                      ? theme.colors.primary.main
                      : theme.colors.surface,
                  borderColor:
                    activeFilter === tab.id ? theme.colors.primary.main : theme.colors.border,
                },
              ]}
              onPress={() => setActiveFilter(tab.id)}
            >
              <Text
                style={[
                  styles.filterTabText,
                  {
                    color:
                      activeFilter === tab.id ? '#fff' : theme.colors.textSecondary,
                  },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </>
  );

  const listEmpty = isLoading ? (
    <View style={{ paddingVertical: 40 }}>
      <ActivityIndicator size="large" color={theme.colors.primary.main} />
    </View>
  ) : (
    <View style={styles.emptyContainer}>
      <EmptyState
        icon={<Home size={64} color={theme.colors.textTertiary} />}
        title="Nu ai proprietăți"
        message={
          activeFilter === 'all'
            ? 'Adaugă primul tău anunț pentru a începe să primești vizualizări și contacte.'
            : `Nu ai proprietăți ${activeFilter === 'active' ? 'active' : activeFilter === 'draft' ? 'în ciornă' : 'expirate'}.`
        }
        actionLabel={activeFilter === 'all' ? 'Adaugă proprietate' : undefined}
        onAction={activeFilter === 'all' ? handleAddProperty : undefined}
      />
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      <ScreenHeader title="Proprietățile mele" />

      <FlatList
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        data={filteredProperties}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item: property }) => (
          <View style={styles.propertiesListItem}>
            <PropertyListItem
              property={property}
              onPress={() => handlePropertyPress(String(property.id), property)}
              onEdit={() => handleEdit(String(property.id), property)}
              onDelete={() => handleDelete(String(property.id))}
              onStats={() => handleStats(String(property.id))}
              onBoost={() => handleBoost(String(property.id))}
            />
          </View>
        )}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary.main}
          />
        }
      />

      {/* FAB - Add Property Button */}
      <TouchableOpacity
        style={[
          styles.fab,
          {
            backgroundColor: theme.colors.primary.main,
            ...theme.shadows.lg,
          },
        ]}
        onPress={handleAddProperty}
        activeOpacity={0.8}
      >
        <Plus size={28} color="#fff" strokeWidth={2.5} />
      </TouchableOpacity>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
    width: '100%',
  },
  summaryContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  summaryCard: {
    padding: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#fff',
  },
  summaryLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  filterContainer: {
    paddingVertical: 16,
  },
  filterScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  filterTabText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  propertiesList: {
    paddingHorizontal: 16,
    gap: 16,
  },
  propertiesListItem: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  propertyCard: {
    overflow: 'hidden',
  },
  cardImageContainer: {
    height: 120,
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardImageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    zIndex: 1,
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
  },
  boostBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  boostText: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
    color: '#fff',
  },
  cardContent: {
    padding: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  cardPrice: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  cardLocation: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    marginBottom: 12,
  },
  ownershipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginBottom: 8,
  },
  ownershipBadgeText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
  },
  statDot: {
    marginHorizontal: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    // borderTopColor applied dynamically
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 60,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Quota banner
  quotaBannerContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  quotaBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  quotaText: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
  },
  quotaUpgradeLink: {
    fontSize: 13,
    fontFamily: 'Inter-SemiBold',
  },
});

export default MyPropertiesScreen;
