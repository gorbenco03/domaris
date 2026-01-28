/**
 * IMOBI - Saved Searches Screen
 * List of saved searches with notification alerts management
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Switch,
  Alert,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Search,
  Bell,
  BellOff,
  Trash2,
  MapPin,
  Home,
  Euro,
  Calendar,
  Filter,
  ChevronRight,
  Plus,
  Sparkles,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme } from '@/app/providers/ThemeProvider';
import { useAuth } from '@/app/providers/AuthProvider';
import { SearchStackParamList } from '@/app/navigation/types';
import { EmptyState, AuthRequiredScreen, ScreenHeader } from '@/shared/components';
import {
  useSavedSearches,
  useDeleteSavedSearch,
  useToggleSavedSearchAlerts,
} from '../hooks/useSavedSearches';
import type { ISavedSearch } from '../api/savedSearchesApi';

// ============================================
// TYPES
// ============================================

type NavigationProp = NativeStackNavigationProp<SearchStackParamList>;

const ALERT_FREQUENCY_LABELS: Record<string, string> = {
  INSTANT: 'Instant',
  DAILY: 'Zilnic',
  WEEKLY: 'Săptămânal',
};

// ============================================
// SAVED SEARCH CARD COMPONENT
// ============================================

interface SavedSearchCardProps {
  search: ISavedSearch;
  onPress: () => void;
  onToggleAlert: (enabled: boolean) => void;
  onDelete: () => void;
  onChangeFrequency: () => void;
}

const SavedSearchCard: React.FC<SavedSearchCardProps> = ({
  search,
  onPress,
  onToggleAlert,
  onDelete,
  onChangeFrequency,
}) => {
  const { theme } = useTheme();

  const formatPrice = (value: number) => {
    return `${value.toLocaleString('ro-RO')} €`;
  };

  const formatPriceRange = () => {
    const { priceMin, priceMax } = search.params;
    if (priceMin && priceMax) {
      return `${formatPrice(priceMin)} - ${formatPrice(priceMax)}`;
    }
    if (priceMin) return `de la ${formatPrice(priceMin)}`;
    if (priceMax) return `până la ${formatPrice(priceMax)}`;
    return 'Orice preț';
  };

  const getCityLabel = () => {
    return search.params.city || 'Orice oraș';
  };

  return (
    <TouchableOpacity
      style={[
        styles.searchCard,
        {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.borderRadius.xl,
          ...theme.shadows.card,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Header with name and new listings badge */}
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          <Search size={18} color={theme.colors.primary.main} />
          <Text
            style={[styles.cardTitle, { color: theme.colors.textPrimary }]}
            numberOfLines={1}
          >
            {search.name}
          </Text>
        </View>
        {search.newMatchesCount > 0 && (
          <View style={[styles.newBadge, { backgroundColor: theme.colors.secondary.error }]}>
            <Text style={styles.newBadgeText}>{search.newMatchesCount} noi</Text>
          </View>
        )}
      </View>

      {/* Search criteria */}
      <View style={styles.criteriaContainer}>
        <View style={styles.criteriaRow}>
          <View style={[styles.criteriaTag, { backgroundColor: theme.colors.accent.main + '15' }]}>
            <Euro size={12} color={theme.colors.accent.main} />
            <Text style={[styles.criteriaTagText, { color: theme.colors.accent.main }]}>
              {formatPriceRange()}
            </Text>
          </View>
        </View>

        <View style={styles.locationRow}>
          <MapPin size={14} color={theme.colors.textSecondary} />
          <Text style={[styles.locationText, { color: theme.colors.textSecondary }]} numberOfLines={1}>
            {getCityLabel()}
          </Text>
        </View>

        {(search.params.roomsMin || search.params.surfaceMin) && (
          <View style={styles.characteristicsRow}>
            {search.params.roomsMin && (
              <Text style={[styles.characteristicText, { color: theme.colors.textTertiary }]}>
                {search.params.roomsMin}
                {search.params.roomsMax ? `-${search.params.roomsMax}` : '+'} camere
              </Text>
            )}
            {search.params.surfaceMin && (
              <Text style={[styles.characteristicText, { color: theme.colors.textTertiary }]}>
                • min {search.params.surfaceMin} m²
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Alert settings */}
      <View style={[styles.alertSection, { borderTopColor: theme.colors.border }]}>
        <View style={styles.alertRow}>
          <View style={styles.alertInfo}>
            {search.alertsEnabled ? (
              <Bell size={16} color={theme.colors.accent.main} />
            ) : (
              <BellOff size={16} color={theme.colors.textTertiary} />
            )}
            <Text style={[styles.alertText, { color: theme.colors.textSecondary }]}>
              {search.alertsEnabled
                ? `Alerte ${ALERT_FREQUENCY_LABELS[search.alertFrequency]}`
                : 'Alerte dezactivate'}
            </Text>
          </View>
          <Switch
            value={search.alertsEnabled}
            onValueChange={onToggleAlert}
            trackColor={{
              false: theme.colors.border,
              true: theme.colors.accent.main + '50',
            }}
            thumbColor={search.alertsEnabled ? theme.colors.accent.main : theme.colors.textTertiary}
          />
        </View>

        {search.alertsEnabled && (
          <TouchableOpacity
            style={[styles.frequencyButton, { borderColor: theme.colors.border }]}
            onPress={onChangeFrequency}
          >
            <Text style={[styles.frequencyText, { color: theme.colors.textSecondary }]}>
              Schimbă frecvența
            </Text>
            <ChevronRight size={16} color={theme.colors.textTertiary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Actions */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.colors.primary.main }]}
          onPress={onPress}
        >
          <Search size={16} color="#fff" />
          <Text style={styles.actionButtonText}>Vezi rezultate</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.deleteButton, { backgroundColor: theme.colors.secondary.error + '15' }]}
          onPress={onDelete}
        >
          <Trash2 size={18} color={theme.colors.secondary.error} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

// ============================================
// MAIN SCREEN
// ============================================

const SavedSearchesScreen: React.FC = () => {
  const { theme } = useTheme();
  const { isAuthenticated } = useAuth();
  const navigation = useNavigation<NavigationProp>();

  // React Query hooks
  const { data: searches = [], isLoading, refetch } = useSavedSearches({
    enabled: isAuthenticated,
  });
  const deleteMutation = useDeleteSavedSearch();
  const toggleAlertsMutation = useToggleSavedSearchAlerts();

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleSearchPress = (search: ISavedSearch) => {
    // Navigate to search results with saved search ID
    navigation.navigate('SavedSearchResults', { searchId: search.id });
  };

  const handleToggleAlert = async (searchId: number, enabled: boolean) => {
    try {
      await toggleAlertsMutation.mutateAsync({
        id: searchId,
        enabled,
        frequency: enabled ? 'DAILY' : undefined,
      });
    } catch (error) {
      Alert.alert('Eroare', 'Nu s-au putut actualiza alertele');
    }
  };

  const handleChangeFrequency = async (search: ISavedSearch) => {
    const frequencies: Array<'INSTANT' | 'DAILY' | 'WEEKLY'> = [
      'INSTANT',
      'DAILY',
      'WEEKLY',
    ];
    const currentIndex = search.alertFrequency
      ? frequencies.indexOf(search.alertFrequency)
      : 0;
    const nextFrequency = frequencies[(currentIndex + 1) % frequencies.length];

    try {
      await toggleAlertsMutation.mutateAsync({
        id: search.id,
        enabled: true,
        frequency: nextFrequency,
      });
    } catch (error) {
      Alert.alert('Eroare', 'Nu s-a putut actualiza frecvența');
    }
  };

  const handleDelete = (searchId: number) => {
    Alert.alert(
      'Șterge căutarea',
      'Ești sigur că vrei să ștergi această căutare salvată?',
      [
        { text: 'Anulează', style: 'cancel' },
        {
          text: 'Șterge',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMutation.mutateAsync(searchId);
            } catch (error) {
              Alert.alert('Eroare', 'Nu s-a putut șterge căutarea');
            }
          },
        },
      ]
    );
  };

  const handleCreateSearch = () => {
    navigation.navigate('SearchFilters');
  };

  const totalNewListings = searches.reduce(
    (acc, s) => acc + s.newMatchesCount,
    0
  );
  const activeAlerts = searches.filter((s) => s.alertsEnabled).length;

  if (!isAuthenticated) {
    return (
      <AuthRequiredScreen message="Autentifică-te pentru a vedea căutările salvate." />
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        edges={['top']}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary.main} />
          <Text
            style={[styles.loadingText, { color: theme.colors.textSecondary }]}
          >
            Se încarcă căutările salvate...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      <ScreenHeader
        title="Căutări salvate"
        rightSlot={
          <TouchableOpacity style={styles.addButton} onPress={handleCreateSearch}>
            <Plus size={24} color={theme.colors.primary.main} />
          </TouchableOpacity>
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
        {/* Summary Card */}
        {searches.length > 0 && (
          <LinearGradient
            colors={theme.gradients.primary as unknown as [string, string, ...string[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.summaryCard, { borderRadius: theme.borderRadius.xl }]}
          >
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{searches.length}</Text>
                <Text style={styles.summaryLabel}>Căutări</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{activeAlerts}</Text>
                <Text style={styles.summaryLabel}>Alerte active</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <View style={styles.newListingsValue}>
                  <Text style={styles.summaryValue}>{totalNewListings}</Text>
                  {totalNewListings > 0 && <Sparkles size={16} color="#fff" />}
                </View>
                <Text style={styles.summaryLabel}>Anunțuri noi</Text>
              </View>
            </View>
          </LinearGradient>
        )}

        {/* Saved Searches List */}
        {searches.length > 0 ? (
          <View style={styles.searchesList}>
            {searches.map((search) => (
              <SavedSearchCard
                key={search.id}
                search={search}
                onPress={() => handleSearchPress(search)}
                onToggleAlert={(enabled) => handleToggleAlert(search.id, enabled)}
                onDelete={() => handleDelete(search.id)}
                onChangeFrequency={() => handleChangeFrequency(search)}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <EmptyState
              icon={<Search size={64} color={theme.colors.textTertiary} />}
              title="Nu ai căutări salvate"
              message="Salvează căutările tale pentru a primi notificări când apar anunțuri noi care se potrivesc criteriilor tale."
              actionLabel="Creează căutare"
              onAction={handleCreateSearch}
            />
          </View>
        )}

        {/* Info Section */}
        <View style={[styles.infoSection, { backgroundColor: theme.colors.surface }]}>
          <Bell size={20} color={theme.colors.secondary.info} />
          <View style={styles.infoContent}>
            <Text style={[styles.infoTitle, { color: theme.colors.textPrimary }]}>
              Cum funcționează alertele?
            </Text>
            <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
              Când activezi alertele pentru o căutare, vei primi notificări push de fiecare dată când apar anunțuri noi care corespund criteriilor tale.
            </Text>
          </View>
        </View>
      </ScrollView>
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
    paddingBottom: 40,
  },
  summaryCard: {
    padding: 20,
    marginBottom: 20,
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
  newListingsValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  searchesList: {
    gap: 16,
  },
  searchCard: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    flex: 1,
  },
  newBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  newBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
  },
  criteriaContainer: {
    marginBottom: 12,
  },
  criteriaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  criteriaTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  criteriaTagText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationText: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    flex: 1,
  },
  characteristicsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  characteristicText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  alertSection: {
    paddingTop: 12,
    marginTop: 12,
    borderTopWidth: 1,
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  alertInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  alertText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  frequencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
  frequencyText: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  deleteButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    paddingTop: 60,
  },
  infoSection: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    lineHeight: 18,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
});

export default SavedSearchesScreen;
