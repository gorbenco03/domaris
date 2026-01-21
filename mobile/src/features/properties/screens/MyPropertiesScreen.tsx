/**
 * IMOBI - My Properties Screen
 * Lists all properties owned by the user with filtering and management options
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
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
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
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme } from '@/app/providers/ThemeProvider';
import { ProfileStackParamList } from '@/app/navigation/types';
import Button from '@/shared/components/Button';
import { EmptyState } from '@/shared/components/EmptyState';

// ============================================
// TYPES
// ============================================

type NavigationProp = NativeStackNavigationProp<ProfileStackParamList>;

type PropertyStatus = 'active' | 'draft' | 'pending' | 'expired' | 'rejected';

interface MyProperty {
  id: string;
  title: string;
  transactionType: 'SALE' | 'RENT';
  price: number;
  currency: 'EUR' | 'RON';
  location: {
    city: string;
    neighborhood?: string;
  };
  image: string;
  status: PropertyStatus;
  createdAt: string;
  expiresAt?: string;
  stats: {
    views: number;
    contacts: number;
    favorites: number;
  };
  isBoosted?: boolean;
}

type FilterTab = 'all' | 'active' | 'draft' | 'expired';

// ============================================
// MOCK DATA
// ============================================

const MOCK_PROPERTIES: MyProperty[] = [
  {
    id: 'prop-1',
    title: 'Apartament 3 camere, Drumul Taberei',
    transactionType: 'SALE',
    price: 120000,
    currency: 'EUR',
    location: { city: 'București', neighborhood: 'Drumul Taberei' },
    image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400',
    status: 'active',
    createdAt: '2026-01-10',
    expiresAt: '2026-02-10',
    stats: { views: 234, contacts: 12, favorites: 45 },
    isBoosted: true,
  },
  {
    id: 'prop-2',
    title: 'Casă 4 camere cu grădină',
    transactionType: 'SALE',
    price: 250000,
    currency: 'EUR',
    location: { city: 'București', neighborhood: 'Pipera' },
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400',
    status: 'active',
    createdAt: '2026-01-05',
    expiresAt: '2026-02-05',
    stats: { views: 156, contacts: 8, favorites: 23 },
  },
  {
    id: 'prop-3',
    title: 'Garsonieră modernă, zona centrală',
    transactionType: 'RENT',
    price: 450,
    currency: 'EUR',
    location: { city: 'București', neighborhood: 'Universitate' },
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400',
    status: 'draft',
    createdAt: '2026-01-15',
    stats: { views: 0, contacts: 0, favorites: 0 },
  },
  {
    id: 'prop-4',
    title: 'Apartament 2 camere, Militari',
    transactionType: 'RENT',
    price: 350,
    currency: 'EUR',
    location: { city: 'București', neighborhood: 'Militari' },
    image: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=400',
    status: 'expired',
    createdAt: '2025-12-01',
    expiresAt: '2026-01-01',
    stats: { views: 89, contacts: 3, favorites: 11 },
  },
  {
    id: 'prop-5',
    title: 'Spațiu comercial, Piața Victoriei',
    transactionType: 'RENT',
    price: 1200,
    currency: 'EUR',
    location: { city: 'București', neighborhood: 'Piața Victoriei' },
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400',
    status: 'pending',
    createdAt: '2026-01-18',
    stats: { views: 0, contacts: 0, favorites: 0 },
  },
];

const FILTER_TABS: { id: FilterTab; label: string }[] = [
  { id: 'all', label: 'Toate' },
  { id: 'active', label: 'Active' },
  { id: 'draft', label: 'Ciorne' },
  { id: 'expired', label: 'Expirate' },
];

// ============================================
// PROPERTY CARD COMPONENT
// ============================================

interface PropertyListItemProps {
  property: MyProperty;
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

  const getStatusConfig = (status: PropertyStatus) => {
    switch (status) {
      case 'active':
        return { label: 'Activ', color: theme.colors.accent.main, icon: CheckCircle };
      case 'draft':
        return { label: 'Ciornă', color: theme.colors.textTertiary, icon: FileText };
      case 'pending':
        return { label: 'În verificare', color: theme.colors.secondary.warning, icon: Clock };
      case 'expired':
        return { label: 'Expirat', color: theme.colors.secondary.error, icon: AlertCircle };
      case 'rejected':
        return { label: 'Respins', color: theme.colors.secondary.error, icon: AlertCircle };
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
        {property.image ? (
          <View style={[styles.cardImage, { backgroundColor: theme.colors.border }]}>
            <Home size={40} color={theme.colors.textTertiary} />
          </View>
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
          {formatPrice(property.price, property.currency, property.transactionType)}
        </Text>

        <Text style={[styles.cardLocation, { color: theme.colors.textSecondary }]}>
          {property.location.neighborhood
            ? `${property.location.neighborhood}, ${property.location.city}`
            : property.location.city}
        </Text>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Eye size={14} color={theme.colors.textTertiary} />
            <Text style={[styles.statText, { color: theme.colors.textSecondary }]}>
              {property.stats.views}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statDot, { color: theme.colors.textTertiary }]}>•</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statText, { color: theme.colors.textSecondary }]}>
              {property.stats.contacts} contacte
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

          {property.status === 'active' && !property.isBoosted && (
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

  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [properties, setProperties] = useState<MyProperty[]>(MOCK_PROPERTIES);

  const filteredProperties = properties.filter((p) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'active') return p.status === 'active' || p.status === 'pending';
    if (activeFilter === 'draft') return p.status === 'draft';
    if (activeFilter === 'expired') return p.status === 'expired' || p.status === 'rejected';
    return true;
  });

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  }, []);

  const handlePropertyPress = (propertyId: string) => {
    // Navigate to property detail or edit
    navigation.navigate('EditProperty', { propertyId });
  };

  const handleEdit = (propertyId: string) => {
    navigation.navigate('EditProperty', { propertyId });
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
          onPress: () => {
            setProperties((prev) => prev.filter((p) => p.id !== propertyId));
          },
        },
      ]
    );
  };

  const handleStats = (propertyId: string) => {
    navigation.navigate('PropertyStats', { propertyId });
  };

  const handleBoost = (propertyId: string) => {
    navigation.navigate('BoostPurchase', { propertyId });
  };

  const handleAddProperty = () => {
    navigation.navigate('CreateProperty');
  };

  const stats = {
    total: properties.length,
    active: properties.filter((p) => p.status === 'active').length,
    drafts: properties.filter((p) => p.status === 'draft').length,
    expired: properties.filter((p) => p.status === 'expired').length,
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>
          Proprietățile mele
        </Text>
        <View style={{ width: 44 }} />
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

        {/* Properties List */}
        {filteredProperties.length > 0 ? (
          <View style={styles.propertiesList}>
            {filteredProperties.map((property) => (
              <PropertyListItem
                key={property.id}
                property={property}
                onPress={() => handlePropertyPress(property.id)}
                onEdit={() => handleEdit(property.id)}
                onDelete={() => handleDelete(property.id)}
                onStats={() => handleStats(property.id)}
                onBoost={() => handleBoost(property.id)}
              />
            ))}
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
        )}
      </ScrollView>

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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
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
    paddingBottom: 100,
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
});

export default MyPropertiesScreen;
