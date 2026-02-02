/**
 * RIVA - Property Comparison Screen
 * Side-by-side comparison of 2-4 properties
 */

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Share2, X } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme } from '@/app/providers/ThemeProvider';
import { Button, ScreenHeader } from '@/shared/components';
import { FavoritesStackParamList } from '@/app/navigation/types';
import { useCompareFavorites } from '../hooks/useFavorites';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const LABEL_COLUMN_WIDTH = 90;
const HORIZONTAL_PADDING = 16;

const PropertyCompareScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<FavoritesStackParamList, 'Compare'>>();
  const route = useRoute();
  const params = route.params as FavoritesStackParamList['Compare'];
  const initialPropertyIds = params?.propertyIds || [];
  const [activePropertyIds, setActivePropertyIds] = useState<number[]>(
    initialPropertyIds.map((id) => Number(id)).filter((id) => Number.isFinite(id))
  );

  const { data: comparison, isLoading } = useCompareFavorites(activePropertyIds);
  const properties = comparison?.properties || [];
  const comparisonRows = comparison?.matrix || [];
  
  // Calculate column width to fit all properties on screen without horizontal scroll
  const columnWidth = useMemo(() => {
    const columns = Math.max(properties.length, 1);
    const availableWidth = SCREEN_WIDTH - HORIZONTAL_PADDING * 2 - LABEL_COLUMN_WIDTH;
    const gapSpace = (columns - 1) * 8; // gap between columns
    return Math.floor((availableWidth - gapSpace) / columns);
  }, [properties.length]);

  const handleRemoveProperty = (propertyId: number) => {
    const next = activePropertyIds.filter((id) => id !== propertyId);
    if (next.length < 2) {
      navigation.goBack();
      return;
    }
    setActivePropertyIds(next);
  };

  const renderPropertyHeader = (property: { id: number; title: string; address?: string; city?: string; image?: string | null }, index: number) => (
    <View
      key={property.id}
      style={[
        styles.propertyHeader,
        {
          width: columnWidth,
          marginLeft: index === 0 ? 0 : 8,
        },
      ]}
    >
      {/* Image */}
      {property.image ? (
        <Image
          source={{ uri: property.image }}
          style={[
            styles.propertyImage,
            {
              borderRadius: theme.borderRadius.md,
              marginBottom: theme.spacing[2],
            },
          ]}
          resizeMode="cover"
        />
      ) : (
        <View
          style={[
            styles.propertyImage,
            {
              backgroundColor: theme.colors.border,
              borderRadius: theme.borderRadius.md,
              marginBottom: theme.spacing[2],
            },
          ]}
        >
          <Text style={[styles.imagePlaceholder, { color: theme.colors.textTertiary }]}>📷</Text>
        </View>
      )}

      {/* Title */}
      <Text
        style={[
          styles.propertyTitle,
          {
            color: theme.colors.textPrimary,
            fontSize: theme.typography.fontSize.sm,
            marginBottom: theme.spacing[1],
          },
        ]}
        numberOfLines={2}
      >
        {property.title}
      </Text>

      {/* Location */}
      <Text
        style={[
          styles.propertyLocation,
          {
            color: theme.colors.textSecondary,
            fontSize: theme.typography.fontSize.xs,
            marginBottom: theme.spacing[2],
          },
        ]}
        numberOfLines={1}
      >
        {[property.address, property.city].filter(Boolean).join(', ')}
      </Text>

      {/* Remove Button */}
      <TouchableOpacity
        style={[
          styles.removeButton,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            borderRadius: theme.borderRadius.md,
          },
        ]}
        onPress={() => handleRemoveProperty(property.id)}
      >
        <X size={16} color={theme.colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );

  const renderComparisonRow = (row: {
    label: string;
    values: Array<{ propertyId: number; formatted: string }>;
  }) => {
    const valuesById = new Map(
      row.values.map((value) => [value.propertyId, value.formatted])
    );

    return (
    <View
      key={row.label}
      style={[
        styles.comparisonRow,
        {
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.divider,
          paddingVertical: theme.spacing[3],
        },
      ]}
    >
      {/* Label Column */}
      <View style={[styles.labelColumn, { width: LABEL_COLUMN_WIDTH }]}>
        <Text
          style={[
            styles.rowLabel,
            {
              color: theme.colors.textSecondary,
              fontSize: theme.typography.fontSize.xs,
            },
          ]}
        >
          {row.label}
        </Text>
      </View>

      {/* Value Columns */}
      {properties.map((property) => {
        const formattedValue = valuesById.get(property.id) ?? '-';

        return (
          <View
            key={property.id}
            style={[
              styles.valueColumn,
              {
                width: columnWidth,
                marginLeft: 8,
                borderRadius: theme.borderRadius.sm,
                paddingVertical: theme.spacing[1],
              },
            ]}
          >
            <Text
              style={[
                styles.valueText,
                {
                  color: theme.colors.textPrimary,
                  fontSize: theme.typography.fontSize.sm,
                  fontWeight: '500',
                },
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              {formattedValue}
            </Text>
          </View>
        );
      })}
    </View>
  );
  };

  if (activePropertyIds.length < 2) {
    return (
      <SafeAreaView
        style={[styles.container, styles.loadingContainer, { backgroundColor: theme.colors.background }]}
        edges={['top']}
      >
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
          Selectează cel puțin 2 proprietăți pentru comparație.
        </Text>
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.container, styles.loadingContainer, { backgroundColor: theme.colors.background }]}
        edges={['top']}
      >
        <ActivityIndicator size="large" color={theme.colors.primary.main} />
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
          Se încarcă comparația...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      <ScreenHeader
        title={`Comparație (${properties.length})`}
        rightSlot={
          <TouchableOpacity style={styles.shareButton}>
            <Share2 size={24} color={theme.colors.primary.main} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: HORIZONTAL_PADDING },
        ]}
      >
        {/* Property Headers */}
        <View style={[styles.headersRow, { paddingTop: theme.spacing[4] }]}>
          <View style={{ width: LABEL_COLUMN_WIDTH }} />
          {properties.map((property, index) => renderPropertyHeader(property, index))}
        </View>

        {/* Comparison Table */}
        <View
          style={[
            styles.table,
            {
              backgroundColor: theme.colors.surface,
              borderRadius: theme.borderRadius.xl,
              marginTop: theme.spacing[4],
              padding: theme.spacing[2],
              ...theme.shadows.card,
            },
          ]}
        >
          {comparisonRows.map(renderComparisonRow)}
        </View>

        {/* Action Buttons */}
        <View
          style={[
            styles.actionsContainer,
            {
              paddingTop: theme.spacing[6],
              paddingBottom: theme.spacing[8],
              gap: theme.spacing[3],
            },
          ]}
        >
          {properties.map((property) => (
            <Button
              key={property.id}
              title={`Vezi ${property.title}`}
              onPress={() =>
                navigation.navigate('PropertyDetail', { propertyId: String(property.id) })
              }
              variant="secondary"
              fullWidth
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  shareButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    // Content container
  },
  headersRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  propertyHeader: {
    alignItems: 'center',
    minHeight: 150,
    justifyContent: 'flex-start',
  },
  propertyImage: {
    width: '100%',
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholder: {
    fontSize: 32,
  },
  propertyTitle: {
    fontWeight: '600',
    textAlign: 'center',
  },
  propertyLocation: {
    textAlign: 'center',
  },
  removeButton: {
    width: 28,
    height: 28,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tableContainer: {
    // Container styles
  },
  table: {
    // Table styles applied inline
  },
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  labelColumn: {
    justifyContent: 'center',
  },
  rowLabel: {
    fontWeight: '600',
  },
  valueColumn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueText: {
    textAlign: 'center',
  },
  actionsContainer: {
    // Styles applied inline
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 24,
  },
  loadingText: {
    fontSize: 14,
    textAlign: 'center',
  },
});

export default PropertyCompareScreen;
