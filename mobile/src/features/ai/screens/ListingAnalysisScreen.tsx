/**
 * IMOBI - Listing Analysis Screen
 * AI-powered analysis and optimization for property listings
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Sparkles,
  AlertTriangle,
  Lightbulb,
  Camera,
  TrendingUp,
  TrendingDown,
  DollarSign,
  FileText,
  CheckCircle,
  ChevronRight,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';

import { useTheme } from '@/app/providers/ThemeProvider';
import { Button } from '@/shared/components';

interface AnalysisSection {
  id: string;
  title: string;
  icon: any;
  score: number;
  maxScore: number;
  status: 'good' | 'warning' | 'critical';
  issues: string[];
  suggestions: string[];
}

const ListingAnalysisScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const [expandedSection, setExpandedSection] = useState<string | null>('price');

  // Mock property data
  const property = {
    title: 'Apartament 3 camere',
    location: 'Drumul Taberei, București',
    price: 120000,
  };

  const overallScore = 72;

  const analysisSections: AnalysisSection[] = [
    {
      id: 'price',
      title: 'Analiză Preț',
      icon: DollarSign,
      score: 45,
      maxScore: 100,
      status: 'critical',
      issues: [
        'Prețul tău: 120.000€',
        'Preț mediu zonă: 98.000€',
        'Ești cu 22% peste piață',
      ],
      suggestions: [
        'Redu prețul la 95.000€ - 105.000€',
        'Poate reduce vizibilitatea cu 40%',
        'Timpul mediu de vânzare poate crește cu 60%',
      ],
    },
    {
      id: 'description',
      title: 'Descriere',
      icon: FileText,
      score: 78,
      maxScore: 100,
      status: 'warning',
      issues: [
        'Lungime OK (320 caractere)',
        'Lipsesc: anul renovării, tip încălzire',
      ],
      suggestions: [
        'Adaugă detalii despre vecinătate',
        'Menționează proximitatea metroului',
        'Include informații despre orientare',
      ],
    },
    {
      id: 'photos',
      title: 'Fotografii',
      icon: Camera,
      score: 65,
      maxScore: 100,
      status: 'warning',
      issues: [
        '8 fotografii încărcate',
        'Lipsesc poze cu: bucătărie, baie',
        'Calitate medie',
      ],
      suggestions: [
        'Adaugă minim 5 poze suplimentare',
        'Anunțurile cu poze complete au +60% contacte',
        'Folosește lumină naturală pentru poze mai bune',
      ],
    },
  ];

  const marketInsights = {
    demandLevel: 'high' as const,
    avgDaysOnMarket: 28,
    competitionLevel: 72,
    bestTimeToList: 'Martie - Mai',
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
  };

  const getStatusColor = (status: AnalysisSection['status']) => {
    switch (status) {
      case 'good':
        return theme.colors.accent.main;
      case 'warning':
        return theme.colors.secondary.warning;
      case 'critical':
        return theme.colors.secondary.error;
    }
  };

  const getStatusIcon = (status: AnalysisSection['status']) => {
    switch (status) {
      case 'good':
        return CheckCircle;
      case 'warning':
        return AlertTriangle;
      case 'critical':
        return TrendingDown;
    }
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
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <LinearGradient
            colors={['#6366f1', '#8b5cf6', '#10b981']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.aiIconGradient}
          >
            <Sparkles size={20} color="#ffffff" />
          </LinearGradient>
          <Text
            style={[
              styles.headerTitle,
              {
                color: theme.colors.textPrimary,
                fontSize: theme.typography.fontSize.base,
              },
            ]}
          >
            Analiză AI
          </Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Property Info */}
        <View
          style={[
            styles.propertyCard,
            {
              backgroundColor: theme.colors.surface,
              marginHorizontal: theme.spacing[4],
              marginTop: theme.spacing[4],
              padding: theme.spacing[4],
              borderRadius: theme.borderRadius.xl,
              ...theme.shadows.sm,
            },
          ]}
        >
          <Text
            style={[
              styles.propertyTitle,
              {
                color: theme.colors.textPrimary,
                fontSize: theme.typography.fontSize.lg,
              },
            ]}
          >
            🏠 {property.title}
          </Text>
          <Text
            style={[
              styles.propertyLocation,
              {
                color: theme.colors.textSecondary,
                fontSize: theme.typography.fontSize.sm,
                marginTop: theme.spacing[1],
              },
            ]}
          >
            📍 {property.location}
          </Text>
        </View>

        {/* Overall Score */}
        <View
          style={[
            styles.scoreCard,
            {
              marginHorizontal: theme.spacing[4],
              marginTop: theme.spacing[4],
            },
          ]}
        >
          <LinearGradient
            colors={
              overallScore >= 80
                ? [theme.colors.accent.main, theme.colors.accent.light]
                : overallScore >= 60
                ? [theme.colors.secondary.warning, '#fbbf24']
                : [theme.colors.secondary.error, '#f87171']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.scoreGradient, { borderRadius: theme.borderRadius.xl }]}
          >
            <View style={styles.scoreContent}>
              <Text style={styles.scoreLabel}>Scor Anunț</Text>
              <View style={styles.scoreRow}>
                <Text style={styles.scoreValue}>{overallScore}</Text>
                <Text style={styles.scoreMax}>/100</Text>
              </View>
              <View style={[styles.progressBar, { marginTop: theme.spacing[3] }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${overallScore}%`,
                      backgroundColor: 'rgba(255, 255, 255, 0.3)',
                    },
                  ]}
                />
              </View>
              <Text
                style={[
                  styles.scoreMessage,
                  { marginTop: theme.spacing[2], fontSize: theme.typography.fontSize.sm },
                ]}
              >
                Cu îmbunătățirile sugerate poți ajunge la 95/100
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* Analysis Sections */}
        <View style={[styles.sectionsContainer, { marginTop: theme.spacing[4] }]}>
          <Text
            style={[
              styles.sectionTitle,
              {
                color: theme.colors.textPrimary,
                fontSize: theme.typography.fontSize.lg,
                marginHorizontal: theme.spacing[4],
                marginBottom: theme.spacing[3],
              },
            ]}
          >
            Detalii Analiză
          </Text>

          {analysisSections.map((section) => {
            const Icon = section.icon;
            const StatusIcon = getStatusIcon(section.status);
            const isExpanded = expandedSection === section.id;
            const statusColor = getStatusColor(section.status);

            return (
              <View
                key={section.id}
                style={[
                  styles.analysisCard,
                  {
                    backgroundColor: theme.colors.surface,
                    marginHorizontal: theme.spacing[4],
                    marginBottom: theme.spacing[3],
                    borderRadius: theme.borderRadius.xl,
                    borderLeftWidth: 4,
                    borderLeftColor: statusColor,
                    ...theme.shadows.sm,
                  },
                ]}
              >
                <TouchableOpacity
                  style={[styles.analysisHeader, { padding: theme.spacing[4] }]}
                  onPress={() => toggleSection(section.id)}
                >
                  <View
                    style={[
                      styles.iconContainer,
                      {
                        backgroundColor: statusColor + '20',
                      },
                    ]}
                  >
                    <Icon size={20} color={statusColor} />
                  </View>
                  <View style={styles.analysisInfo}>
                    <Text
                      style={[
                        styles.analysisTitle,
                        {
                          color: theme.colors.textPrimary,
                          fontSize: theme.typography.fontSize.base,
                        },
                      ]}
                    >
                      {section.title}
                    </Text>
                    <View style={styles.scoreRow}>
                      <Text
                        style={[
                          styles.sectionScore,
                          {
                            color: statusColor,
                            fontSize: theme.typography.fontSize.sm,
                          },
                        ]}
                      >
                        {section.score}/{section.maxScore}
                      </Text>
                    </View>
                  </View>
                  <StatusIcon size={20} color={statusColor} />
                  <ChevronRight
                    size={20}
                    color={theme.colors.textTertiary}
                    style={{
                      transform: [{ rotate: isExpanded ? '90deg' : '0deg' }],
                    }}
                  />
                </TouchableOpacity>

                {/* Expanded Content */}
                {isExpanded && (
                  <View
                    style={[
                      styles.expandedContent,
                      {
                        paddingHorizontal: theme.spacing[4],
                        paddingBottom: theme.spacing[4],
                        borderTopWidth: 1,
                        borderTopColor: theme.colors.border,
                      },
                    ]}
                  >
                    {/* Issues */}
                    {section.issues.length > 0 && (
                      <View style={[styles.issuesContainer, { marginTop: theme.spacing[3] }]}>
                        <Text
                          style={[
                            styles.subsectionTitle,
                            {
                              color: theme.colors.textPrimary,
                              fontSize: theme.typography.fontSize.sm,
                              marginBottom: theme.spacing[2],
                            },
                          ]}
                        >
                          ⚠️ Probleme identificate:
                        </Text>
                        {section.issues.map((issue, index) => (
                          <Text
                            key={index}
                            style={[
                              styles.issueText,
                              {
                                color: theme.colors.textSecondary,
                                fontSize: theme.typography.fontSize.sm,
                                marginBottom: theme.spacing[1],
                              },
                            ]}
                          >
                            • {issue}
                          </Text>
                        ))}
                      </View>
                    )}

                    {/* Suggestions */}
                    {section.suggestions.length > 0 && (
                      <View style={[styles.suggestionsContainer, { marginTop: theme.spacing[3] }]}>
                        <Text
                          style={[
                            styles.subsectionTitle,
                            {
                              color: theme.colors.textPrimary,
                              fontSize: theme.typography.fontSize.sm,
                              marginBottom: theme.spacing[2],
                            },
                          ]}
                        >
                          💡 Recomandări:
                        </Text>
                        {section.suggestions.map((suggestion, index) => (
                          <View key={index} style={styles.suggestionRow}>
                            <Lightbulb size={14} color={theme.colors.accent.main} />
                            <Text
                              style={[
                                styles.suggestionText,
                                {
                                  color: theme.colors.textSecondary,
                                  fontSize: theme.typography.fontSize.sm,
                                },
                              ]}
                            >
                              {suggestion}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Action Buttons */}
                    {section.id === 'description' && (
                      <Button
                        title="Generează descriere AI"
                        onPress={() => {}}
                        variant="primary"
                        fullWidth
                        style={{ marginTop: theme.spacing[3] }}
                      />
                    )}
                    {section.id === 'price' && (
                      <Button
                        title="Ajustează prețul"
                        onPress={() => {}}
                        variant="primary"
                        fullWidth
                        style={{ marginTop: theme.spacing[3] }}
                      />
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Market Insights */}
        <View
          style={[
            styles.marketInsights,
            {
              backgroundColor: theme.colors.primary.main + '08',
              marginHorizontal: theme.spacing[4],
              marginTop: theme.spacing[4],
              marginBottom: theme.spacing[6],
              padding: theme.spacing[4],
              borderRadius: theme.borderRadius.xl,
            },
          ]}
        >
          <Text
            style={[
              styles.marketTitle,
              {
                color: theme.colors.textPrimary,
                fontSize: theme.typography.fontSize.lg,
                marginBottom: theme.spacing[3],
              },
            ]}
          >
            📊 Insights Piață
          </Text>
          <View style={styles.insightRow}>
            <TrendingUp size={16} color={theme.colors.accent.main} />
            <Text
              style={[
                styles.insightText,
                {
                  color: theme.colors.textSecondary,
                  fontSize: theme.typography.fontSize.sm,
                },
              ]}
            >
              Cerere: <Text style={{ fontWeight: '600' }}>Ridicată</Text>
            </Text>
          </View>
          <View style={styles.insightRow}>
            <Text
              style={[
                styles.insightText,
                {
                  color: theme.colors.textSecondary,
                  fontSize: theme.typography.fontSize.sm,
                },
              ]}
            >
              Timp mediu vânzare: <Text style={{ fontWeight: '600' }}>{marketInsights.avgDaysOnMarket} zile</Text>
            </Text>
          </View>
          <View style={styles.insightRow}>
            <Text
              style={[
                styles.insightText,
                {
                  color: theme.colors.textSecondary,
                  fontSize: theme.typography.fontSize.sm,
                },
              ]}
            >
              Perioada optimă: <Text style={{ fontWeight: '600' }}>{marketInsights.bestTimeToList}</Text>
            </Text>
          </View>
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
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  propertyCard: {},
  propertyTitle: {
    fontWeight: '600',
  },
  propertyLocation: {},
  scoreCard: {},
  scoreGradient: {
    padding: 24,
  },
  scoreContent: {
    alignItems: 'center',
  },
  scoreLabel: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  scoreValue: {
    color: '#ffffff',
    fontSize: 48,
    fontWeight: '700',
  },
  scoreMax: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 24,
    fontWeight: '600',
    marginLeft: 4,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  scoreMessage: {
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  sectionsContainer: {},
  sectionTitle: {
    fontWeight: '600',
  },
  analysisCard: {},
  analysisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  analysisInfo: {
    flex: 1,
  },
  analysisTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
  sectionScore: {
    fontWeight: '600',
  },
  expandedContent: {},
  issuesContainer: {},
  subsectionTitle: {
    fontWeight: '600',
  },
  issueText: {
    lineHeight: 20,
  },
  suggestionsContainer: {},
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  suggestionText: {
    flex: 1,
    lineHeight: 20,
  },
  marketInsights: {},
  marketTitle: {
    fontWeight: '600',
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  insightText: {
    lineHeight: 20,
  },
});

export default ListingAnalysisScreen;
