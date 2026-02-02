/**
 * RIVA - Favorites List Screen
 * Main screen for viewing and managing favorite properties
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Plus,
  X,
  MapPin,
  Bed,
  Bath,
  Square,
  TrendingDown,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '@/app/providers/ThemeProvider';
import { PAGINATION } from '@/config/constants';
import { FavoritesStackParamList } from '@/app/navigation/types';
import { Button } from '@/shared/components';
import {
  useCreateFavoriteList,
  useDeleteFavoriteList,
  useFavoriteLists,
  useFavorites,
  useMoveFavorite,
  useRemoveFavorite,
  useUpdateFavoriteList,
} from '../hooks/useFavorites';

interface FavoriteList {
  id: string;
  name: string;
  count: number;
  isDefault: boolean;
}

interface FavoriteProperty {
  favoriteId: number;
  propertyId: number;
  title: string;
  location: string;
  price: number;
  priceAtSave: number;
  imageUrl?: string;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  notes?: string;
  savedAt: Date;
}

const FavoritesListScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<FavoritesStackParamList, 'Favorites'>>();
  const [selectedList, setSelectedList] = useState<string>('all');
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
  const [isCreateListModalOpen, setIsCreateListModalOpen] = useState(false);
  const [isManageListsModalOpen, setIsManageListsModalOpen] = useState(false);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [listDraftName, setListDraftName] = useState<Record<string, string>>({});

  const favoriteParams = useMemo(
    () => ({
      listId: selectedList !== 'all' ? selectedList : undefined,
      page: 1,
      limit: PAGINATION.MAX_PAGE_SIZE,
    }),
    [selectedList]
  );

  const {
    data: favoritesData,
    isLoading,
    isFetching,
    refetch: refetchFavorites,
  } = useFavorites(favoriteParams);
  const {
    data: listsData,
    refetch: refetchLists,
  } = useFavoriteLists();
  const removeFavoriteMutation = useRemoveFavorite();
  const createListMutation = useCreateFavoriteList();
  const updateListMutation = useUpdateFavoriteList();
  const deleteListMutation = useDeleteFavoriteList();
  const moveFavoriteMutation = useMoveFavorite();

  const favoriteLists: FavoriteList[] = useMemo(() => {
    const apiLists = listsData || [];
    const defaultList =
      apiLists.find((list) => list.isDefault) ||
      apiLists.find((list) => list.id === 'default');
    const totalCount = defaultList?.count ?? favoritesData?.meta.total ?? 0;
    const customLists = apiLists.filter(
      (list) => !(list.isDefault || list.id === 'default')
    );

    return [
      { id: 'all', name: 'Toate', count: totalCount, isDefault: true },
      ...customLists.map((list) => ({
        id: list.id,
        name: list.name,
        count: list.count ?? 0,
        isDefault: false,
      })),
    ];
  }, [listsData, favoritesData?.meta.total]);

  const moveListOptions = useMemo(() => {
    const apiLists = listsData || [];
    const defaultList =
      apiLists.find((list) => list.isDefault) ||
      apiLists.find((list) => list.id === 'default');
    const options = [
      {
        id: 'default',
        name: defaultList?.name || 'Toate favoritele',
      },
      ...apiLists.filter((list) => !list.isDefault && list.id !== 'default').map((list) => ({
        id: list.id,
        name: list.name,
      })),
    ];
    return options;
  }, [listsData]);

  const favoriteProperties: FavoriteProperty[] = useMemo(() => {
    const items = favoritesData?.data || [];
    return items
      .filter((favorite) => favorite.property)
      .map((favorite) => {
        const property = favorite.property!;
        const location = [property.address, property.city].filter(Boolean).join(', ');
        const price = property.price ?? 0;
        const area = property.surface ?? property.area;
        return {
          favoriteId: favorite.id,
          propertyId: favorite.propertyId,
          title: property.title,
          location: location || property.city || '',
          price,
          priceAtSave: price,
          imageUrl: property.image || undefined,
          bedrooms: property.rooms,
          bathrooms: undefined,
          area,
          notes: favorite.notes || undefined,
          savedAt: favorite.addedAt ? new Date(favorite.addedAt) : new Date(),
        };
      });
  }, [favoritesData?.data]);

  const togglePropertySelection = (propertyId: string) => {
    setSelectedProperties((prev) =>
      prev.includes(propertyId)
        ? prev.filter((id) => id !== propertyId)
        : [...prev, propertyId]
    );
  };

  const handleCompareToggle = (propertyId: string) => {
    if (!isEditMode) {
      setIsEditMode(true);
    }
    togglePropertySelection(propertyId);
  };

  const handleRemoveFavorite = async (propertyId: number) => {
    try {
      await removeFavoriteMutation.mutateAsync(propertyId);
      setSelectedProperties((prev) =>
        prev.filter((id) => id !== String(propertyId))
      );
    } catch (error) {
      console.warn('Failed to remove favorite', error);
    }
  };

  const handleCreateList = async () => {
    const trimmed = newListName.trim();
    if (!trimmed) return;
    try {
      await createListMutation.mutateAsync({ name: trimmed });
      setNewListName('');
      setIsCreateListModalOpen(false);
    } catch (error) {
      console.warn('Failed to create list', error);
    }
  };

  const handleUpdateList = async (listId: string) => {
    const name = (listDraftName[listId] || '').trim();
    if (!name) return;
    try {
      await updateListMutation.mutateAsync({ listId, payload: { name } });
    } catch (error) {
      console.warn('Failed to update list', error);
    }
  };

  const handleDeleteList = (listId: string) => {
    Alert.alert(
      'Șterge lista',
      'Favoritele vor rămâne în lista principală.',
      [
        { text: 'Anulează', style: 'cancel' },
        {
          text: 'Șterge',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteListMutation.mutateAsync(listId);
              if (selectedList === listId) {
                setSelectedList('all');
              }
            } catch (error) {
              console.warn('Failed to delete list', error);
            }
          },
        },
      ]
    );
  };

  const handleMoveSelected = async (toListId: string) => {
    const fromListId = selectedList !== 'all' ? selectedList : undefined;
    try {
      await Promise.all(
        selectedProperties.map((propertyId) =>
          moveFavoriteMutation.mutateAsync({
            propertyId: Number(propertyId),
            toListId,
            fromListId,
          })
        )
      );
      setSelectedProperties([]);
      setIsEditMode(false);
      setIsMoveModalOpen(false);
    } catch (error) {
      console.warn('Failed to move favorites', error);
    }
  };

  const onRefresh = useCallback(async () => {
    await Promise.all([refetchFavorites(), refetchLists()]);
  }, [refetchFavorites, refetchLists]);

  const renderListChip = (list: FavoriteList) => {
    const isSelected = selectedList === list.id;
    return (
      <TouchableOpacity
        key={list.id}
        onPress={() => setSelectedList(list.id)}
        onLongPress={() => {
          if (!list.isDefault) {
            setIsManageListsModalOpen(true);
          }
        }}
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
              color: isSelected ? theme.colors.surface : theme.colors.textPrimary,
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
    const propertyKey = String(item.propertyId);
    const isSelected = selectedProperties.includes(propertyKey);
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
            togglePropertySelection(propertyKey);
          } else {
            navigation.navigate('PropertyDetail', { propertyId: propertyKey });
          }
        }}
      >
        {/* Image Section */}
        <View style={styles.imageContainer}>
          {item.imageUrl ? (
            <Image
              source={{ uri: item.imageUrl }}
              style={[
                styles.image,
                {
                  borderTopLeftRadius: theme.borderRadius.xl,
                  borderTopRightRadius: theme.borderRadius.xl,
                },
              ]}
              resizeMode="cover"
            />
          ) : (
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
          )}

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
              {isSelected && <Text style={[styles.checkmark, { color: theme.colors.surface }]}>✓</Text>}
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
            {typeof item.bedrooms === 'number' && (
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
            )}
            {typeof item.bedrooms === 'number' && typeof item.bathrooms === 'number' && (
              <Text style={[styles.featureSeparator, { color: theme.colors.textTertiary }]}>·</Text>
            )}
            {typeof item.bathrooms === 'number' && (
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
            )}
            {(typeof item.bedrooms === 'number' || typeof item.bathrooms === 'number') &&
              typeof item.area === 'number' && (
                <Text style={[styles.featureSeparator, { color: theme.colors.textTertiary }]}>·</Text>
              )}
            {typeof item.area === 'number' && (
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
            )}
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
              onPress={() => handleCompareToggle(propertyKey)}
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
              onPress={() => handleRemoveFavorite(item.propertyId)}
            >
              <X size={20} color={theme.colors.secondary.error} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.container, styles.loadingContainer, { backgroundColor: theme.colors.background }]}
        edges={['top']}
      >
        <ActivityIndicator size="large" color={theme.colors.primary.main} />
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
          Se încarcă favoritele...
        </Text>
      </SafeAreaView>
    );
  }

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
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => setIsManageListsModalOpen(true)}>
            <Text
              style={[
                styles.editButton,
                {
                  color: theme.colors.textSecondary,
                  fontSize: theme.typography.fontSize.base,
                },
              ]}
            >
              Liste
            </Text>
          </TouchableOpacity>
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
          onPress={() => setIsCreateListModalOpen(true)}
        >
          <Plus size={20} color={theme.colors.accent.main} />
        </TouchableOpacity>
      </View>

      {/* Properties List */}
      <FlatList
        data={favoriteProperties}
        keyExtractor={(item) => String(item.propertyId)}
        renderItem={renderPropertyCard}
        contentContainerStyle={[
          styles.listContent,
          { paddingHorizontal: theme.spacing[4], paddingTop: theme.spacing[4] },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary.main}
          />
        }
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

      {/* Floating Actions */}
      {selectedProperties.length >= 1 && (
        <View
          style={[
            styles.floatingButtonContainer,
            {
              backgroundColor: theme.colors.background,
              borderTopWidth: 1,
              borderTopColor: theme.colors.border,
              paddingHorizontal: theme.spacing[4],
              paddingTop: theme.spacing[3],
              paddingBottom: theme.spacing[6],
            },
          ]}
        >
          <View style={styles.floatingActionsRow}>
            <TouchableOpacity
              style={[
                styles.moveButton,
                {
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.surface,
                },
              ]}
              onPress={() => setIsMoveModalOpen(true)}
            >
              <Text style={[styles.moveButtonText, { color: theme.colors.textPrimary }]}>
                Mută în listă
              </Text>
            </TouchableOpacity>
            <LinearGradient
              colors={[theme.colors.accent.main, theme.colors.accent.dark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.compareButton, { borderRadius: theme.borderRadius.lg }]}
            >
              <TouchableOpacity
                style={styles.compareButtonInner}
                onPress={() =>
                  navigation.navigate('Compare', { propertyIds: selectedProperties })
                }
                disabled={selectedProperties.length < 2}
              >
                <Text
                  style={[
                    styles.compareButtonText,
                    {
                      color: theme.colors.surface,
                      opacity: selectedProperties.length < 2 ? 0.5 : 1,
                    },
                  ]}
                >
                  {selectedProperties.length < 2
                    ? 'Selectează încă 1'
                    : `Compară ${selectedProperties.length} proprietăți`}
                </Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </View>
      )}

      {/* Create List Modal */}
      <Modal transparent visible={isCreateListModalOpen} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>
              Listă nouă
            </Text>
            <TextInput
              value={newListName}
              onChangeText={setNewListName}
              placeholder="Nume listă"
              placeholderTextColor={theme.colors.textTertiary}
              style={[
                styles.modalInput,
                {
                  borderColor: theme.colors.border,
                  color: theme.colors.textPrimary,
                },
              ]}
            />
            <View style={styles.modalActions}>
              <Button
                title="Anulează"
                onPress={() => setIsCreateListModalOpen(false)}
                variant="secondary"
                style={{ flex: 1 }}
              />
              <Button
                title="Creează"
                onPress={handleCreateList}
                variant="primary"
                style={{ flex: 1 }}
                disabled={!newListName.trim()}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Manage Lists Modal */}
      <Modal transparent visible={isManageListsModalOpen} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>
              Liste favorite
            </Text>
            <View style={styles.modalListContainer}>
              {(listsData || [])
                .filter((list) => !list.isDefault && list.id !== 'default')
                .map((list) => (
                  <View key={list.id} style={styles.listRow}>
                    <TextInput
                      value={listDraftName[list.id] ?? list.name}
                      onChangeText={(value) =>
                        setListDraftName((prev) => ({ ...prev, [list.id]: value }))
                      }
                      style={[
                        styles.listInput,
                        {
                          borderColor: theme.colors.border,
                          color: theme.colors.textPrimary,
                        },
                      ]}
                    />
                    <TouchableOpacity
                      onPress={() => handleUpdateList(list.id)}
                      style={[styles.listActionButton, { borderColor: theme.colors.border }]}
                    >
                      <Text style={{ color: theme.colors.textPrimary }}>Salvează</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteList(list.id)}
                      style={[styles.listActionButton, { borderColor: theme.colors.secondary.error }]}
                    >
                      <Text style={{ color: theme.colors.secondary.error }}>Șterge</Text>
                    </TouchableOpacity>
                  </View>
                ))}
            </View>
            <Button title="Închide" onPress={() => setIsManageListsModalOpen(false)} />
          </View>
        </View>
      </Modal>

      {/* Move Modal */}
      <Modal transparent visible={isMoveModalOpen} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>
              Mută în listă
            </Text>
            <View style={styles.modalListContainer}>
              {moveListOptions.map((list) => (
                <TouchableOpacity
                  key={list.id}
                  onPress={() => handleMoveSelected(list.id)}
                  style={[styles.moveOption, { borderColor: theme.colors.border }]}
                >
                  <Text style={{ color: theme.colors.textPrimary }}>{list.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Button title="Anulează" onPress={() => setIsMoveModalOpen(false)} />
          </View>
        </View>
      </Modal>
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
  headerActions: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
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
  image: {
    width: '100%',
    height: '100%',
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
    // color applied dynamically
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  floatingActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  moveButton: {
    height: 56,
    borderWidth: 1,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  moveButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  compareButton: {
    height: 56,
    flex: 1,
  },
  compareButtonInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compareButtonText: {
    // color applied dynamically
    fontSize: 16,
    fontWeight: '700',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalListContainer: {
    gap: 12,
  },
  listRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  listInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  listActionButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  moveOption: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
});

export default FavoritesListScreen;
