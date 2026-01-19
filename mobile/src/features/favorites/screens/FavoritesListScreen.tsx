/**
 * IMOBI - Favorites List Screen
 * Main screen for viewing and managing favorite properties
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Heart,
  Plus,
  Edit2,
  X,
  MapPin,
  Bed,
  Bath,
  Square,
  TrendingDown,
  Eye,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '@/app/providers/ThemeProvider';
import { Button, Badge } from '@/shared/components';

interface FavoriteList {
  id: string;
  name: string;
  count: number;
  isDefault: boolean;
}

interface FavoriteProperty {
  id: string;
  title: string;
  location: string;
  price: number;
  priceAtSave: number;
  imageUrl: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  notes?: string;
  savedAt: Date;
}

const FavoritesListScreen: React.FC = () => {
  const { theme } = useTheme();
  const [selectedList, setSelectedList] = useState<string>('all');
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);

  // Mock data - in production, this would come from backend
  const favoriteLists: FavoriteList[] = [
    { id: 'all', name: 'Toate', count: 12, isDefault: true },
    { id: 'bucuresti', name: 'București', count: 5, isDefault: false },
    { id: 'urgent', name: 'Urgent', count: 3, isDefault: false },
  ];

  const favoriteProperties: FavoriteProperty[] = [
    {
      id: '1',
      title: 'Apartament 3 camere',
      location: 'Drumul Taberei, București',
      price: 90000,
      priceAtSave: 95000,
      imageUrl: 'https://via.placeholder.com/400x250',
      bedrooms: 3,
      bathrooms: 2,
      area: 75,
      notes: 'Sună luni pentru vizionare',
      savedAt: new Date('2026-01-15'),
    },
    {
      id: '2',
      title: 'Casă 4 camere',
      location: 'Bragadiru, Ilfov',
      price: 180000,
      priceAtSave: 180000,
      imageUrl: 'https://via.placeholder.com/400x250',
      bedrooms: 4,
      bathrooms: 3,
      area: 150,
      savedAt: new Date('2026-01-18'),
    },
  ];

  const togglePropertySelection = (propertyId: string) => {
    setSelectedProperties((prev) =>
      prev.includes(propertyId)
        ? prev.filter((id) => id !== propertyId)
        : [...prev, propertyId]
    );
  };

  const renderListChip = (list: FavoriteList) => {
    const isSelected = selectedList === list.id;
    return (
      <TouchableOpacity
        key={list.id}
        onPress={() => setSelectedList(list.id)}
        style={[
          styles.listChip,
          {
            backgroundColor: isSelected
              ? theme.colors.primary.main
              : theme.colors.surface,
            borderColor: isSelected
              ? theme.colors.primary.main
              : theme.colors.border,
            ...(!isSelected && theme.shadows.sm),
          },
        ]}
      >
        <Text
          style={[
            styles.listChipText,
            {
              color: isSelected ? '#ffffff' : theme.colors.textPrimary,
              fontSize: theme.typography.fontSize.sm,
            },
          ]}
        >
          {list.name} ({list.count})
        </Text>
      </TouchableOpacity>
    );
  };

  const renderPropertyCard = ({ item }: { item: FavoriteProperty }) => {
    const isSelected = selectedProperties.includes(item.id);
    const priceChange = item.price - item.priceAtSave;
    const hasPriceChange = priceChange !== 0;

    return (
      <TouchableOpacity
        style={[
          styles.propertyCard,
          {
            backgroundColor: theme.colors.surface,
            borderColor: isSelected
              ? theme.colors.accent.main
              : theme.colors.border,
            borderWidth: isSelected ? 2 : 1,
            marginBottom: theme.spacing[4],
            ...theme.shadows.card,
          },
        ]}
        onPress={() => {
          if (isEditMode) {
            togglePropertySelection(item.id);
          } else {
            // Navigate to property detail
          }
        }}
      >
        {/* Image Section */}
        <View style={styles.imageContainer}>
          <View
            style={[
              styles.imagePlaceholder,
              {
                backgroundColor: theme.colors.border,
                borderTopLeftRadius: theme.borderRadius.xl,
                borderTopRightRadius: theme.borderRadius.xl,
              },
            ]}
          >
            <Text style={[styles.placeholderText, { color: theme.colors.textTertiary }]}>
              📷
            </Text>
          </View>

          {/* Price Badge */}
          <View style={[styles.priceBadge, { backgroundColor: 'rgba(255,255,255,0.95)' }]}>
            <Text
              style={[
                styles.priceText,
                {
                  color: theme.colors.textPrimary,
                  fontSize: theme.typography.fontSize.lg,
                },
              ]}
            >
              {item.price.toLocaleString('ro-RO')} €
            </Text>
            {hasPriceChange && (
              <View style={styles.priceChangeRow}>
                <TrendingDown
                  size={14}
                  color={priceChange < 0 ? theme.colors.accent.main : theme.colors.secondary.error}
                />
                <Text
                  style={[
                    styles.priceChangeText,
                    {
                      color: priceChange < 0 ? theme.colors.accent.main : theme.colors.secondary.error,
                      fontSize: theme.typography.fontSize.xs,
                    },
                  ]}
                >
                  {priceChange < 0 ? '' : '+'}
                  {priceChange.toLocaleString('ro-RO')} €
                </Text>
              </View>
            )}
          </View>

          {/* Selection Indicator */}
          {isEditMode && (
            <View
              style={[
                styles.selectionIndicator,
                {
                  backgroundColor: isSelected
                    ? theme.colors.accent.main
                    : 'rgba(255,255,255,0.9)',
                  borderColor: isSelected ? theme.colors.accent.main : theme.colors.border,
                },
              ]}
            >
              {isSelected && <Text style={styles.checkmark}>✓</Text>}
            </View>
          )}
        </View>

        {/* Content Section */}
        <View style={[styles.cardContent, { padding: theme.spacing[4] }]}>
          {/* Title */}
          <Text
            style={[
              styles.propertyTitle,
              {
                color: theme.colors.textPrimary,
                fontSize: theme.typography.fontSize.lg,
              },
            ]}
          >
            {item.title}
          </Text>

          {/* Location */}
          <View style={[styles.locationRow, { marginTop: theme.spacing[2] }]}>
            <MapPin size={16} color={theme.colors.textSecondary} />
            <Text
              style={[
                styles.locationText,
                {
                  color: theme.colors.textSecondary,
                  fontSize: theme.typography.fontSize.sm,
                },
              ]}
            >
              {item.location}
            </Text>
          </View>

          {/* Features */}
          <View style={[styles.featuresRow, { marginTop: theme.spacing[3] }]}>
            <View style={styles.feature}>
              <Bed size={16} color={theme.colors.textTertiary} />
              <Text
                style={[
                  styles.featureText,
                  {
                    color: theme.colors.textSecondary,
                    fontSize: theme.typography.fontSize.sm,
                  },
                ]}
              >
                {item.bedrooms}
              </Text>
            </View>
            <Text style={[styles.featureSeparator, { color: theme.colors.textTertiary }]}>·</Text>
            <View style={styles.feature}>
              <Bath size={16} color={theme.colors.textTertiary} />
              <Text
                style={[
                  styles.featureText,
                  {
                    color: theme.colors.textSecondary,
                    fontSize: theme.typography.fontSize.sm,
                  },
                ]}
              >
                {item.bathrooms}
              </Text>
            </View>
            <Text style={[styles.featureSeparator, { color: theme.colors.textTertiary }]}>·</Text>
            <View style={styles.feature}>
              <Square size={16} color={theme.colors.textTertiary} />
              <Text
                style={[
                  styles.featureText,
                  {
                    color: theme.colors.textSecondary,
                    fontSize: theme.typography.fontSize.sm,
                  },
                ]}
              >
                {item.area} m²
              </Text>
            </View>
          </View>

          {/* Notes */}
          {item.notes && (
            <View
              style={[
                styles.notesContainer,
                {
                  backgroundColor: theme.colors.secondary.info + '08',
                  marginTop: theme.spacing[3],
                  padding: theme.spacing[2],
                  borderRadius: theme.borderRadius.md,
                },
              ]}
            >
              <Text
                style={[
                  styles.notesText,
                  {
                    color: theme.colors.textSecondary,
                    fontSize: theme.typography.fontSize.sm,
                  },
                ]}
              >
                📝 "{item.notes}"
              </Text>
            </View>
          )}

          {/* Actions */}
          <View style={[styles.actionsRow, { marginTop: theme.spacing[4], gap: theme.spacing[2] }]}>
            <Button
              title="Compară"
              onPress={() => {/* Add to comparison */}}
              variant="secondary"
              style={{ flex: 1 }}
            />
            <TouchableOpacity
              style={[
                styles.removeButton,
                {
                  borderColor: theme.colors.secondary.error,
                  borderRadius: theme.borderRadius.lg,
                },
              ]}
            >
              <X size={20} color={theme.colors.secondary.error} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.colors.surface,
            borderBottomColor: theme.colors.border,
          },
        ]}
      >
        <Text
          style={[
            styles.headerTitle,
            {
              color: theme.colors.textPrimary,
              fontSize: theme.typography.fontSize['2xl'],
            },
          ]}
        >
          Favorite
        </Text>
        <TouchableOpacity
          onPress={() => {
            setIsEditMode(!isEditMode);
            setSelectedProperties([]);
          }}
        >
          <Text
            style={[
              styles.editButton,
              {
                color: theme.colors.primary.main,
                fontSize: theme.typography.fontSize.base,
              },
            ]}
          >
            {isEditMode ? 'Anulează' : 'Editează'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Lists Horizontal Scroll */}
      <View
        style={[
          styles.listsContainer,
          {
            backgroundColor: theme.colors.surface,
            borderBottomColor: theme.colors.border,
            paddingVertical: theme.spacing[3],
          },
        ]}
      >
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={favoriteLists}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => renderListChip(item)}
          contentContainerStyle={[
            styles.listsContent,
            { paddingHorizontal: theme.spacing[4] },
          ]}
        />
        <TouchableOpacity
          style={[
            styles.addListButton,
            {
              backgroundColor: theme.colors.accent.main + '15',
              borderRadius: theme.borderRadius.full,
            },
          ]}
        >
          <Plus size={20} color={theme.colors.accent.main} />
        </TouchableOpacity>
      </View>

      {/* Properties List */}
      <FlatList
        data={favoriteProperties}
        keyExtractor={(item) => item.id}
        renderItem={renderPropertyCard}
        contentContainerStyle={[
          styles.listContent,
          { paddingHorizontal: theme.spacing[4], paddingTop: theme.spacing[4] },
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={[styles.emptyEmoji]}>💭</Text>
            <Text
              style={[
                styles.emptyTitle,
                {
                  color: theme.colors.textPrimary,
                  fontSize: theme.typography.fontSize.xl,
                },
              ]}
            >
              Nicio proprietate salvată
            </Text>
            <Text
              style={[
                styles.emptySubtitle,
                {
                  color: theme.colors.textSecondary,
                  fontSize: theme.typography.fontSize.base,
                },
              ]}
            >
              Apasă pe ♡ pentru a salva proprietățile care te interesează
            </Text>
          </View>
        }
      />

      {/* Floating Compare Button */}
      {selectedProperties.length >= 2 && (
        <View
          style={[
            styles.floatingButtonContainer,
            {
              paddingHorizontal: theme.spacing[4],
              paddingBottom: theme.spacing[4],
            },
          ]}
        >
          <LinearGradient
            colors={[theme.colors.accent.main, theme.colors.accent.dark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.compareButton, { borderRadius: theme.borderRadius.lg }]}
          >
            <TouchableOpacity
              style={styles.compareButtonInner}
              onPress={() => {/* Navigate to compare screen */}}
            >
              <Text style={styles.compareButtonText}>
                Compară {selectedProperties.length} proprietăți
              </Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontWeight: '700',
  },
  editButton: {
    fontWeight: '600',
  },
  listsContainer: {
    borderBottomWidth: 1,
  },
  listsContent: {
    gap: 8,
  },
  listChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  listChipText: {
    fontWeight: '600',
  },
  addListButton: {
    position: 'absolute',
    right: 16,
    top: 12,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 100,
  },
  propertyCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
    height: 180,
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 48,
  },
  priceBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  priceText: {
    fontWeight: '700',
  },
  priceChangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  priceChangeText: {
    fontWeight: '600',
  },
  selectionIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  cardContent: {
    // Padding applied inline
  },
  propertyTitle: {
    fontWeight: '600',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationText: {
    flex: 1,
  },
  featuresRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  featureText: {
    // Styles applied inline
  },
  featureSeparator: {
    marginHorizontal: 8,
    fontSize: 16,
  },
  notesContainer: {
    // Styles applied inline
  },
  notesText: {
    fontStyle: 'italic',
  },
  actionsRow: {
    flexDirection: 'row',
  },
  removeButton: {
    width: 52,
    height: 52,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    textAlign: 'center',
    lineHeight: 24,
  },
  floatingButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  compareButton: {
    height: 56,
  },
  compareButtonInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compareButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default FavoritesListScreen;
