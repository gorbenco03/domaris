/**
 * RIVA - AVM Valuation Card (read-only)
 * Afișează evaluarea automată (model Riva-AVM) pe ecranul de detaliu al unui
 * anunț: preț estimat, interval și poziționarea față de prețul cerut.
 */
import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { TrendingUp, Info } from 'lucide-react-native';
import { useTheme } from '@/app/providers/ThemeProvider';
import { useValuation } from '@/features/properties/hooks/useValuation';

interface AVMValuationCardProps {
  city?: string;
  neighborhood?: string;
  propertyType?: string | null;
  transactionType?: 'SALE' | 'RENT' | null;
  rooms?: number;
  surfaceSqm?: number;
  floor?: number;
  totalFloors?: number;
  yearBuilt?: number;
  amenities?: string[];
  /** Prețul cerut din anunț, pentru comparație sub/peste estimare */
  askingPrice?: number;
}

export const AVMValuationCard: React.FC<AVMValuationCardProps> = ({
  askingPrice,
  transactionType,
  ...params
}) => {
  const { theme } = useTheme();
  const { data, isLoading } = useValuation({
    ...params,
    propertyType: params.propertyType ?? null,
    transactionType: transactionType ?? null,
  });

  const suffix = transactionType === 'RENT' ? '/lună' : '';
  const fmt = (n: number) => `${Math.round(n).toLocaleString('ro-RO')} €${suffix}`;

  const card = {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.divider,
  };

  if (isLoading) {
    return (
      <View style={[styles.card, card, styles.centerRow]}>
        <ActivityIndicator size="small" color={theme.colors.primary.main} />
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
          Se estimează valoarea de piață…
        </Text>
      </View>
    );
  }

  const v = data?.valuation;
  // Fără date suficiente → nu afișăm nimic (păstrăm ecranul curat)
  if (!v || !v.recommendedPrice || v.recommendedPrice <= 0) return null;

  // Poziționare față de prețul cerut
  let verdict: { label: string; color: string } | null = null;
  if (askingPrice && askingPrice > 0) {
    const diff = ((askingPrice - v.recommendedPrice) / v.recommendedPrice) * 100;
    if (diff > 10) verdict = { label: `cu ${Math.round(diff)}% peste estimare`, color: '#C2410C' };
    else if (diff < -10) verdict = { label: `cu ${Math.abs(Math.round(diff))}% sub estimare`, color: '#15803D' };
    else verdict = { label: 'preț corect față de piață', color: theme.colors.primary.main };
  }

  return (
    <View style={[styles.card, card]}>
      <View style={styles.header}>
        <TrendingUp size={18} color={theme.colors.primary.main} />
        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
          Evaluare AI (Riva-AVM)
        </Text>
      </View>

      <Text style={[styles.price, { color: theme.colors.primary.main }]}>{fmt(v.recommendedPrice)}</Text>
      <Text style={[styles.range, { color: theme.colors.textSecondary }]}>
        Interval estimat: {fmt(v.priceRange.min)} – {fmt(v.priceRange.max)}
      </Text>

      {verdict && (
        <View style={styles.verdictRow}>
          <View style={[styles.dot, { backgroundColor: verdict.color }]} />
          <Text style={[styles.verdict, { color: verdict.color }]}>
            Prețul cerut e {verdict.label}
          </Text>
        </View>
      )}

      <View style={styles.footerRow}>
        <Info size={12} color={theme.colors.textTertiary} />
        <Text style={[styles.footer, { color: theme.colors.textTertiary }]}>
          Estimare pe baza tranzacțiilor comparabile · încredere {Math.round((v.confidence || 0) * 100)}%
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 16, padding: 16, marginTop: 16 },
  centerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  loadingText: { fontSize: 13 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  title: { fontSize: 14, fontWeight: '700' },
  price: { fontSize: 26, fontWeight: '800' },
  range: { fontSize: 13, marginTop: 2 },
  verdictRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  verdict: { fontSize: 13, fontWeight: '600' },
  footerRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  footer: { fontSize: 11, flex: 1 },
});

export default AVMValuationCard;
