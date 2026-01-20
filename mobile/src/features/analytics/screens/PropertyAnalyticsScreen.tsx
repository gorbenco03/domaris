import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Share
} from 'react-native';
import { useTheme } from '@/app/providers/ThemeProvider';
import { 
  ArrowLeft, 
  Download, 
  Eye, 
  MessageSquare, 
  Calendar, 
  Heart,
  Share2,
  Trophy,
  Sparkles,
  Info,
  Zap,
  TrendingUp
} from 'lucide-react-native';
import { MetricCard } from '../components/MetricCard';
import { AnalyticsChart } from '../components/AnalyticsChart';
import { SuggestionCard } from '../components/SuggestionCard';
import { usePropertyAnalytics, useAnalyticsSuggestions } from '../hooks/useAnalytics';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '@/app/navigation/types';

type Props = NativeStackScreenProps<ProfileStackParamList, 'PropertyStats'>;

const PERIODS = [
  { id: 'week', label: '7 zile' },
  { id: 'month', label: '30 zile' },
  { id: 'all_time', label: 'Tot' },
];

export const PropertyAnalyticsScreen: React.FC<Props> = ({ route, navigation }) => {
  const { propertyId } = route.params;
  const { theme } = useTheme();
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  
  const { data, loading: statsLoading } = usePropertyAnalytics(propertyId, selectedPeriod);
  const { suggestions, loading: suggestionsLoading } = useAnalyticsSuggestions(propertyId);

  const handleBack = () => navigation.goBack();

  const handleExport = async () => {
    try {
      // Mock export functionality
      await Share.share({
        message: `Raport Statistici IMOBI - Prop: ${propertyId}\nVizualizări: ${data?.views}\nContacte: ${data?.contacts}`,
        title: 'Export Statistici',
      });
    } catch (error) {
      console.error(error);
    }
  };

  if (statsLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary.main} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.divider }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Statistici anunț</Text>
          <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]} numberOfLines={1}>
            Apartament 3 camere, Drumul Taberei
          </Text>
        </View>
        <TouchableOpacity onPress={handleExport} style={styles.exportButton}>
          <Download size={20} color={theme.colors.primary.main} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Period Selector */}
        <View style={[styles.periodSelector, { backgroundColor: theme.colors.surface, ...theme.shadows.sm }]}>
          {PERIODS.map((period) => (
            <TouchableOpacity
              key={period.id}
              style={[
                styles.periodTab,
                selectedPeriod === period.id && [
                  styles.activePeriodTab,
                  { backgroundColor: theme.colors.primary.main }
                ]
              ]}
              onPress={() => setSelectedPeriod(period.id)}
            >
              <Text 
                style={[
                  styles.periodTabText,
                  { color: selectedPeriod === period.id ? '#FFF' : theme.colors.textSecondary }
                ]}
              >
                {period.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Key Metrics Row */}
        <View style={styles.metricsRow}>
          <MetricCard 
            label="Vizualizări" 
            value={data?.views || 0} 
            change={data?.trends.viewsChange} 
            icon={Eye}
          />
          <MetricCard 
            label="Contacte" 
            value={data?.contacts || 0} 
            change={data?.trends.contactsChange} 
            icon={MessageSquare}
          />
          <MetricCard 
            label="Vizionări" 
            value={data?.viewingsRequested || 0} 
            change={data?.trends.viewingsChange} 
            icon={Calendar}
          />
        </View>

        {/* Secondary Metrics Row */}
        <View style={styles.metricsRow}>
          <MetricCard label="Favorite" value={data?.favorites || 0} icon={Heart} />
          <MetricCard label="CTR" value={`${data?.ctr}%`} icon={Sparkles} />
          <MetricCard label="Share" value={data?.shares || 0} icon={Share2} />
        </View>

        {/* Chart Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
            Vizualizări (ultimele 7 zile)
          </Text>
          <AnalyticsChart data={data?.timeline || []} />
        </View>

        {/* Market Comparison */}
        {data?.benchmark && (
          <View style={[styles.marketSection, { backgroundColor: theme.colors.primary.main + '08' }]}>
            <View style={styles.marketHeader}>
              <Trophy size={24} color={theme.colors.secondary.warning} />
              <Text style={[styles.marketTitle, { color: theme.colors.textPrimary }]}>Comparație cu piața</Text>
            </View>
            <Text style={[styles.marketDescription, { color: theme.colors.textSecondary }]}>
              Anunțul tău e în <Text style={{ fontWeight: '700', color: theme.colors.primary.main }}>{data.benchmark.marketStatus}</Text> pentru contacte în zona Drumul Taberei.
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.colors.primary.main }]}
            onPress={() => navigation.navigate('BoostPurchase', { propertyId })}
          >
            <Zap size={20} color="#ffffff" />
            <Text style={styles.actionButtonText}>Promovează anunțul</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.colors.secondary.main }]}
            onPress={() => navigation.navigate('ListingAnalysis', { propertyId })}
          >
            <TrendingUp size={20} color="#ffffff" />
            <Text style={styles.actionButtonText}>Analiză AI</Text>
          </TouchableOpacity>
        </View>

        {/* AI Suggestions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Sparkles size={20} color={theme.colors.secondary.main} />
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary, marginLeft: 8 }]}>
              Sugestii IA pentru optimizare
            </Text>
          </View>

          {suggestionsLoading ? (
            <ActivityIndicator size="small" color={theme.colors.primary.main} />
          ) : (
            suggestions.map(suggestion => (
              <SuggestionCard
                key={suggestion.id}
                type={suggestion.type}
                priority={suggestion.priority}
                message={suggestion.message}
                description={suggestion.description}
                action={suggestion.action}
              />
            ))
          )}
        </View>

        {/* Traffic Sources */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Info size={20} color={theme.colors.textSecondary} />
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary, marginLeft: 8 }]}>
              Surse trafic
            </Text>
          </View>
          <View style={[styles.sourcesContainer, { backgroundColor: theme.colors.surface, ...theme.shadows.card }]}>
            {Object.entries(data?.sources || {}).map(([key, value]) => (
              <View key={key} style={styles.sourceRow}>
                <Text style={[styles.sourceLabel, { color: theme.colors.textSecondary }]}>
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </Text>
                <View style={styles.sourceBarContainer}>
                  <View 
                    style={[
                      styles.sourceBar, 
                      { 
                        width: `${value}%`, 
                        backgroundColor: theme.colors.primary.main 
                      }
                    ]} 
                  />
                </View>
                <Text style={[styles.sourceValue, { color: theme.colors.textPrimary }]}>{value}%</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  exportButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  periodSelector: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  periodTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  activePeriodTab: {
    // Background dynamic
  },
  periodTabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  metricsRow: {
    flexDirection: 'row',
    marginBottom: 8,
    marginHorizontal: -4,
  },
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  marketSection: {
    marginTop: 24,
    padding: 20,
    borderRadius: 16,
  },
  marketHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  marketTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 12,
  },
  marketDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  sourcesContainer: {
    padding: 16,
    borderRadius: 16,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sourceLabel: {
    width: 80,
    fontSize: 14,
  },
  sourceBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  sourceBar: {
    height: '100%',
    borderRadius: 4,
  },
  sourceValue: {
    width: 40,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
});
