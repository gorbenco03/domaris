/**
 * RIVA - AI Analysis Widget Component
 * Shows AI analysis results for property listing
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Bot,
  TrendingUp,
  TrendingDown,
  FileText,
  Camera,
  ChevronRight,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
} from 'lucide-react-native';
import { useTheme } from '@/app/providers/ThemeProvider';
import { Card, Button } from '@/shared/components';

// ============================================
// TYPES
// ============================================

interface AIAnalysisResult {
  overallScore: number;
  pricing: {
    status: 'optimal' | 'high' | 'low';
    currentPrice: number;
    recommendedMin: number;
    recommendedMax: number;
    visibilityImpact: number;
  };
  description: {
    score: number;
    missingKeywords: string[];
    suggestions: string[];
  };
  photos: {
    count: number;
    missingRooms: string[];
    qualityIssues: string[];
  };
}

interface AIAnalysisWidgetProps {
  analysis: AIAnalysisResult | null;
  isLoading?: boolean;
  onGenerateDescription?: () => void;
  onAdjustPrice?: () => void;
  onAddPhotos?: () => void;
  onRefreshAnalysis?: () => void;
}

// ============================================
// COMPONENT
// ============================================

export const AIAnalysisWidget: React.FC<AIAnalysisWidgetProps> = ({
  analysis,
  isLoading = false,
  onGenerateDescription,
  onAdjustPrice,
  onAddPhotos,
  onRefreshAnalysis,
}) => {
  const { theme } = useTheme();
  const [isExpanded, setIsExpanded] = useState(true);

  if (!analysis && !isLoading) {
    return null;
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return theme.colors.accent.main;
    if (score >= 60) return theme.colors.secondary.warning;
    return theme.colors.secondary.error;
  };

  const getPriceStatusConfig = () => {
    if (!analysis) return null;
    
    const { pricing } = analysis;
    
    if (pricing.status === 'optimal') {
      return {
        icon: <CheckCircle size={18} color={theme.colors.accent.main} />,
        label: 'Preț optim',
        color: theme.colors.accent.main,
      };
    } else if (pricing.status === 'high') {
      return {
        icon: <TrendingUp size={18} color={theme.colors.secondary.warning} />,
        label: 'Preț ridicat',
        color: theme.colors.secondary.warning,
      };
    } else {
      return {
        icon: <TrendingDown size={18} color={theme.colors.secondary.info} />,
        label: 'Sub piață',
        color: theme.colors.secondary.info,
      };
    }
  };

  const priceStatus = getPriceStatusConfig();

  return (
    <Card style={styles.container}>
      {/* Header */}
      <TouchableOpacity
        style={styles.header}
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={theme.gradients.ai}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <Bot size={22} color="#ffffff" />
              <Text style={styles.headerTitle}>Analiză AI</Text>
            </View>
            {analysis && (
              <View style={styles.scoreContainer}>
                <Text style={styles.scoreLabel}>Scor:</Text>
                <Text style={styles.scoreValue}>{analysis.overallScore}</Text>
              </View>
            )}
          </View>
        </LinearGradient>
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.content}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Animated.View style={styles.loadingIcon}>
                <Sparkles size={32} color={theme.colors.secondary.main} />
              </Animated.View>
              <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
                Analizăm anunțul tău...
              </Text>
            </View>
          ) : analysis && (
            <>
              {/* Price Analysis */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  {priceStatus?.icon}
                  <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                    PREȚ
                  </Text>
                  {analysis.pricing.status !== 'optimal' && (
                    <View 
                      style={[
                        styles.statusBadge, 
                        { backgroundColor: `${priceStatus?.color}20` }
                      ]}
                    >
                      <Text style={[styles.statusBadgeText, { color: priceStatus?.color }]}>
                        {priceStatus?.label}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={styles.sectionContent}>
                  <Text style={[styles.priceLabel, { color: theme.colors.textSecondary }]}>
                    Prețul tău: <Text style={styles.priceBold}>{analysis.pricing.currentPrice.toLocaleString()} €</Text>
                  </Text>
                  <Text style={[styles.priceLabel, { color: theme.colors.textSecondary }]}>
                    Recomandat: <Text style={styles.priceBold}>
                      {analysis.pricing.recommendedMin.toLocaleString()}-{analysis.pricing.recommendedMax.toLocaleString()} €
                    </Text>
                  </Text>
                  {analysis.pricing.visibilityImpact !== 0 && (
                    <Text style={[styles.impactText, { color: analysis.pricing.visibilityImpact > 0 ? theme.colors.accent.main : theme.colors.secondary.warning }]}>
                      {analysis.pricing.visibilityImpact > 0 ? '↑' : '↓'} {Math.abs(analysis.pricing.visibilityImpact)}% vizibilitate estimată
                    </Text>
                  )}
                  {analysis.pricing.status !== 'optimal' && (
                    <TouchableOpacity
                      style={[styles.actionButton, { borderColor: theme.colors.primary.main }]}
                      onPress={onAdjustPrice}
                    >
                      <Text style={[styles.actionButtonText, { color: theme.colors.primary.main }]}>
                        Ajustează
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Description Analysis */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <FileText size={18} color={theme.colors.textSecondary} />
                  <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                    DESCRIERE
                  </Text>
                  <View 
                    style={[
                      styles.scoreBadge, 
                      { backgroundColor: `${getScoreColor(analysis.description.score)}20` }
                    ]}
                  >
                    <Text style={[styles.scoreBadgeText, { color: getScoreColor(analysis.description.score) }]}>
                      {analysis.description.score}/100
                    </Text>
                  </View>
                </View>
                <View style={styles.sectionContent}>
                  {analysis.description.missingKeywords.length > 0 && (
                    <Text style={[styles.issueText, { color: theme.colors.textSecondary }]}>
                      Lipsă: {analysis.description.missingKeywords.join(', ')}
                    </Text>
                  )}
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={[styles.aiButton, { backgroundColor: theme.colors.secondary.main }]}
                      onPress={onGenerateDescription}
                    >
                      <Sparkles size={16} color="#ffffff" />
                      <Text style={styles.aiButtonText}>Generează cu AI</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, { borderColor: theme.colors.border }]}
                      onPress={() => {}}
                    >
                      <Text style={[styles.actionButtonText, { color: theme.colors.textSecondary }]}>
                        Editează
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Photos Analysis */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Camera size={18} color={theme.colors.textSecondary} />
                  <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                    FOTOGRAFII
                  </Text>
                  <Text style={[styles.photoCount, { color: theme.colors.textSecondary }]}>
                    {analysis.photos.count} încărcate
                  </Text>
                </View>
                <View style={styles.sectionContent}>
                  {analysis.photos.missingRooms.length > 0 && (
                    <Text style={[styles.issueText, { color: theme.colors.secondary.warning }]}>
                      <AlertTriangle size={14} color={theme.colors.secondary.warning} /> Lipsă: {analysis.photos.missingRooms.join(', ')}
                    </Text>
                  )}
                  {analysis.photos.qualityIssues.length > 0 && analysis.photos.qualityIssues.map((issue, index) => (
                    <Text key={index} style={[styles.issueText, { color: theme.colors.textSecondary }]}>
                      • {issue}
                    </Text>
                  ))}
                  {analysis.photos.missingRooms.length > 0 && (
                    <TouchableOpacity
                      style={[styles.actionButton, { borderColor: theme.colors.primary.main }]}
                      onPress={onAddPhotos}
                    >
                      <Text style={[styles.actionButtonText, { color: theme.colors.primary.main }]}>
                        Adaugă
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Refresh Button */}
              <TouchableOpacity
                style={styles.refreshButton}
                onPress={onRefreshAnalysis}
              >
                <RefreshCw size={16} color={theme.colors.textTertiary} />
                <Text style={[styles.refreshText, { color: theme.colors.textTertiary }]}>
                  Actualizează analiza
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    marginBottom: 20,
  },
  header: {
    overflow: 'hidden',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  headerGradient: {
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  scoreLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: 'rgba(255,255,255,0.8)',
  },
  scoreValue: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
  },
  content: {
    padding: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  loadingIcon: {
    marginBottom: 12,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  section: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 0.5,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusBadgeText: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
  },
  scoreBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  scoreBadgeText: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
  },
  photoCount: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  sectionContent: {
    gap: 8,
  },
  priceLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  priceBold: {
    fontFamily: 'Inter-SemiBold',
  },
  impactText: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    marginTop: 4,
  },
  issueText: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  actionButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  actionButtonText: {
    fontSize: 13,
    fontFamily: 'Inter-SemiBold',
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  aiButtonText: {
    fontSize: 13,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    marginTop: 8,
  },
  refreshText: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
  },
});

export default AIAnalysisWidget;
