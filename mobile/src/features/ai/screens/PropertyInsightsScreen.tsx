/**
 * IMOBI - Property Insights Screen
 * AI summary for property viewers
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Sparkles, MapPin, CheckCircle, AlertTriangle, TrendingUp } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '@/app/providers/ThemeProvider';
import { IconButton } from '@/shared/components';
import { aiApi } from '../api/aiApi';
import { QUERY_KEYS } from '@/config/constants';

const PropertyInsightsScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const route = useRoute<any>();
  const propertyId = route.params?.propertyId;

  const { data: summary, isLoading } = useQuery({
    queryKey: [QUERY_KEYS.AI_ANALYSIS, propertyId, 'summary'],
    queryFn: () => aiApi.getPropertySummary(Number(propertyId)),
    enabled: !!propertyId,
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
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
        <IconButton
          icon={<ArrowLeft size={22} color={theme.colors.textPrimary} />}
          onPress={() => navigation.goBack()}
          variant="surface"
          size="md"
          style={[styles.backButton, { borderWidth: 1, borderColor: theme.colors.border }]}
        />
        <View style={styles.headerCenter}>
          <LinearGradient
            colors={['#6366f1', '#8b5cf6', '#10b981']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.aiIconGradient}
          >
            <Sparkles size={20} color="#ffffff" />
          </LinearGradient>
          <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>AI despre proprietate</Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary.main} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            Se generează rezumatul...
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {(summary?.matchScore !== undefined || summary?.priceComparison) && (
            <View
              style={[
                styles.summaryCard,
                {
                  backgroundColor: theme.colors.surface,
                  borderRadius: theme.borderRadius.xl,
                  ...theme.shadows.sm,
                },
              ]}
            >
              {summary?.matchScore !== undefined && (
                <Text style={[styles.summaryText, { color: theme.colors.textPrimary }]}>
                  Scor potrivire: <Text style={{ fontWeight: '700' }}>{summary.matchScore}/100</Text>
                </Text>
              )}
              {summary?.priceComparison && (
                <View style={{ marginTop: 8 }}>
                  <View style={styles.sectionHeader}>
                    <TrendingUp size={16} color={theme.colors.accent.main} />
                    <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                      Preț vs piață
                    </Text>
                  </View>
                  <Text style={[styles.sectionText, { color: theme.colors.textSecondary }]}>
                    Medie zonă: {summary.priceComparison.averagePrice.toLocaleString('ro-RO')} €
                  </Text>
                  <Text style={[styles.sectionText, { color: theme.colors.textSecondary }]}>
                    {summary.priceComparison.note}
                  </Text>
                </View>
              )}
            </View>
          )}

          <View
            style={[
              styles.summaryCard,
              {
                backgroundColor: theme.colors.surface,
                borderRadius: theme.borderRadius.xl,
                ...theme.shadows.sm,
              },
            ]}
          >
            <Text style={[styles.summaryText, { color: theme.colors.textPrimary }]}>
              {summary?.summary || 'Nu am putut genera un rezumat.'}
            </Text>
          </View>

          {!!summary?.location && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MapPin size={16} color={theme.colors.accent.main} />
                <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Locație</Text>
              </View>
              <Text style={[styles.sectionText, { color: theme.colors.textSecondary }]}>
                {summary.location}
              </Text>
            </View>
          )}

          {!!summary?.highlights?.length && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <CheckCircle size={16} color={theme.colors.accent.main} />
                <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Puncte forte</Text>
              </View>
              {summary.highlights.map((item, index) => (
                <Text key={index} style={[styles.bulletText, { color: theme.colors.textSecondary }]}>
                  • {item}
                </Text>
              ))}
            </View>
          )}

          {!!summary?.amenities?.length && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <CheckCircle size={16} color={theme.colors.accent.main} />
                <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Facilități</Text>
              </View>
              {summary.amenities.map((item, index) => (
                <Text key={index} style={[styles.bulletText, { color: theme.colors.textSecondary }]}>
                  • {item}
                </Text>
              ))}
            </View>
          )}

          {!!summary?.suitableFor?.length && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <CheckCircle size={16} color={theme.colors.accent.main} />
                <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Potrivit pentru</Text>
              </View>
              {summary.suitableFor.map((item, index) => (
                <Text key={index} style={[styles.bulletText, { color: theme.colors.textSecondary }]}>
                  • {item}
                </Text>
              ))}
            </View>
          )}

          {!!summary?.cautions?.length && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <AlertTriangle size={16} color={theme.colors.secondary.warning} />
                <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>De luat în calcul</Text>
              </View>
              {summary.cautions.map((item, index) => (
                <Text key={index} style={[styles.bulletText, { color: theme.colors.textSecondary }]}>
                  • {item}
                </Text>
              ))}
            </View>
          )}
        </ScrollView>
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
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  aiIconGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontWeight: '600',
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  summaryCard: {
    padding: 16,
    marginBottom: 20,
  },
  summaryText: {
    fontSize: 16,
    lineHeight: 22,
  },
  section: {
    marginBottom: 18,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  sectionText: {
    fontSize: 14,
    lineHeight: 20,
  },
  bulletText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
});

export default PropertyInsightsScreen;
