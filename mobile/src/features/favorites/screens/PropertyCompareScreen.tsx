/**
 * IMOBI - Property Comparison Screen
 * Side-by-side comparison of 2-4 properties
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Share2, CheckCircle, X } from 'lucide-react-native';

import { useTheme } from '@/app/providers/ThemeProvider';
import { Button } from '@/shared/components';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 120) / 3; // 3 columns + paddings

interface ComparisonProperty {
  id: string;
  title: string;
  location: string;
  price: number;
  area: number;
  pricePerSqm: number;
  bedrooms: number;
  bathrooms: number;
  floor: string;
  yearBuilt: number;
  hasParking: boolean;
  hasAC: boolean;
  balconies: number;
  imageUrl: string;
}

interface ComparisonRow {
  label: string;
  key: keyof ComparisonProperty;
  type: 'text' | 'number' | 'boolean' | 'currency' | 'badge';
  suffix?: string;
  highlightBest?: 'highest' | 'lowest';
}

const PropertyCompareScreen: React.FC = () => {
  const { theme } = useTheme();

  // Mock data - in production, this would come from route params
  const properties: ComparisonProperty[] = [
    {
      id: '1',
      title: 'Apartament 3 cam',
      location: 'Drumul Taberei',
      price: 95000,
      area: 75,
      pricePerSqm: 1267,
      bedrooms: 3,
      bathrooms: 2,
      floor: '4/10',
      yearBuilt: 2008,
      hasParking: true,
      hasAC: true,
      balconies: 1,
      imageUrl: 'https://via.placeholder.com/300x200',
    },
    {
      id: '2',
      title: 'Apartament 2 cam',
      location: 'Militari',
      price: 87000,
      area: 68,
      pricePerSqm: 1279,
      bedrooms: 2,
      bathrooms: 1,
      floor: '2/8',
      yearBuilt: 2015,
      hasParking: false,
      hasAC: true,
      balconies: 2,
      imageUrl: 'https://via.placeholder.com/300x200',
    },
    {
      id: '3',
      title: 'Apartament 3 cam',
      location: 'Berceni',
      price: 102000,
      area: 82,
      pricePerSqm: 1244,
      bedrooms: 3,
      bathrooms: 2,
      floor: '6/12',
      yearBuilt: 2020,
      hasParking: true,
      hasAC: true,
      balconies: 1,
      imageUrl: 'https://via.placeholder.com/300x200',
    },
  ];

  const comparisonRows: ComparisonRow[] = [
    { label: 'Preț', key: 'price', type: 'currency', highlightBest: 'lowest' },
    { label: 'Suprafață', key: 'area', type: 'number', suffix: 'mp', highlightBest: 'highest' },
    { label: '€/mp', key: 'pricePerSqm', type: 'currency', highlightBest: 'lowest' },
    { label: 'Camere', key: 'bedrooms', type: 'number' },
    { label: 'Băi', key: 'bathrooms', type: 'number' },
    { label: 'Etaj', key: 'floor', type: 'text' },
    { label: 'An construcție', key: 'yearBuilt', type: 'number', highlightBest: 'highest' },
    { label: 'Parcare', key: 'hasParking', type: 'boolean' },
    { label: 'Aer condiționat', key: 'hasAC', type: 'boolean' },
    { label: 'Balcoane', key: 'balconies', type: 'number', highlightBest: 'highest' },
  ];

  const getBestValue = (row: ComparisonRow): any => {
    if (!row.highlightBest) return null;

    const values = properties.map((p) => p[row.key]);
    
    if (row.type === 'boolean') return true;
    
    if (row.highlightBest === 'highest') {
      return Math.max(...(values as number[]));
    } else {
      return Math.min(...(values as number[]));
    }
  };

  const isBestValue = (row: ComparisonRow, value: any): boolean => {
    if (!row.highlightBest) return false;
    const bestValue = getBestValue(row);
    return value === bestValue;
  };

  const formatValue = (row: ComparisonRow, property: ComparisonProperty): string => {
    const value = property[row.key];

    switch (row.type) {
      case 'currency':
        return `${(value as number).toLocaleString('ro-RO')} €`;
      case 'number':
        return `${value}${row.suffix ? ' ' + row.suffix : ''}`;
      case 'boolean':
        return value ? '✓' : '✗';
      case 'badge':
        return String(value);
      default:
        return String(value);
    }
  };

  const renderPropertyHeader = (property: ComparisonProperty) => (
    <View
      key={property.id}
      style={[
        styles.propertyHeader,
        {
          width: COLUMN_WIDTH,
          marginHorizontal: 8,
        },
      ]}
    >
      {/* Image */}
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
      >
        {property.location}
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
      >
        <X size={16} color={theme.colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );

  const renderComparisonRow = (row: ComparisonRow) => (
    <View
      key={row.key}
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
      <View style={[styles.labelColumn, { width: 100 }]}>
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
        const value = property[row.key];
        const isBest = isBestValue(row, value);
        const formattedValue = formatValue(row, property);

        return (
          <View
            key={property.id}
            style={[
              styles.valueColumn,
              {
                width: COLUMN_WIDTH,
                marginHorizontal: 8,
                backgroundColor: isBest ? theme.colors.accent.main + '10' : 'transparent',
                borderRadius: theme.borderRadius.sm,
                paddingVertical: theme.spacing[1],
              },
            ]}
          >
            <Text
              style={[
                styles.valueText,
                {
                  color: isBest ? theme.colors.accent.main : theme.colors.textPrimary,
                  fontSize: theme.typography.fontSize.sm,
                  fontWeight: isBest ? '700' : '500',
                },
              ]}
            >
              {formattedValue}
            </Text>
            {isBest && row.highlightBest && (
              <CheckCircle
                size={12}
                color={theme.colors.accent.main}
                style={{ marginLeft: 4 }}
              />
            )}
          </View>
        );
      })}
    </View>
  );

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
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {/* Navigate back */}}
        >
          <ArrowLeft size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text
          style={[
            styles.headerTitle,
            {
              color: theme.colors.textPrimary,
              fontSize: theme.typography.fontSize.lg,
            },
          ]}
        >
          Comparație ({properties.length})
        </Text>
        <TouchableOpacity style={styles.shareButton}>
          <Share2 size={24} color={theme.colors.primary.main} />
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Property Headers - Horizontal Scroll */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[
            styles.headersContainer,
            {
              paddingHorizontal: theme.spacing[4],
              paddingTop: theme.spacing[4],
            },
          ]}
        >
          <View style={{ width: 100 }} />
          {properties.map(renderPropertyHeader)}
        </ScrollView>

        {/* Comparison Table */}
        <View style={[styles.tableContainer, { paddingHorizontal: theme.spacing[4] }]}>
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
        </View>

        {/* Legend */}
        <View
          style={[
            styles.legend,
            {
              marginHorizontal: theme.spacing[4],
              marginTop: theme.spacing[4],
              padding: theme.spacing[3],
              backgroundColor: theme.colors.accent.main + '08',
              borderRadius: theme.borderRadius.md,
            },
          ]}
        >
          <View style={styles.legendItem}>
            <CheckCircle size={16} color={theme.colors.accent.main} />
            <Text
              style={[
                styles.legendText,
                {
                  color: theme.colors.textSecondary,
                  fontSize: theme.typography.fontSize.xs,
                },
              ]}
            >
              = Cea mai bună valoare
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View
          style={[
            styles.actionsContainer,
            {
              paddingHorizontal: theme.spacing[4],
              paddingTop: theme.spacing[6],
              paddingBottom: theme.spacing[8],
              gap: theme.spacing[3],
            },
          ]}
        >
          {properties.map((property) => (
            <Button
              key={property.id}
              title={`Contactează pentru ${property.title}`}
              onPress={() => {/* Navigate to contact */}}
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
    fontWeight: '600',
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
  headersContainer: {
    flexDirection: 'row',
  },
  propertyHeader: {
    alignItems: 'center',
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
  legend: {
    // Styles applied inline
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendText: {
    fontWeight: '500',
  },
  actionsContainer: {
    // Styles applied inline
  },
});

export default PropertyCompareScreen;
