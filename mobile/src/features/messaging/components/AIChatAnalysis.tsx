/**
 * IMOBI - AI Chat Analysis Component
 * Premium AI widget to summarize conversations or suggest responses
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Sparkles, RefreshCw, X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '@/app/providers/ThemeProvider';

// ============================================
// COMPONENT
// ============================================

interface AIChatAnalysisProps {
  onSuggestResponse?: (suggestion: string) => void;
}

const AIChatAnalysis: React.FC<AIChatAnalysisProps> = ({ onSuggestResponse }) => {
  const { theme } = useTheme();
  
  const [isVisible, setIsVisible] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);

  const startAnalysis = () => {
    setIsAnalyzing(true);
    setSummary(null);
    
    // Simulate AI analysis delay
    setTimeout(() => {
      setIsAnalyzing(false);
      setSummary("Căutătorul este interesat de vizionare sâmbătă dimineața la ora 10:00. Proprietarul a acceptat. Se recomandă confirmarea locației exacte.");
    }, 2000);
  };

  if (!isVisible) {
    return (
      <TouchableOpacity 
        style={styles.floatingButton} 
        onPress={() => {
          setIsVisible(true);
          startAnalysis();
        }}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={theme.gradients.ai as unknown as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.sparkleButton}
        >
          <Sparkles size={18} color="#ffffff" />
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface, ...theme.shadows.lg }]}>
      <LinearGradient
        colors={theme.gradients.ai as unknown as [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <View style={styles.headerTitleContainer}>
            <Sparkles size={16} color="#ffffff" style={{ marginRight: 8 }} />
            <Text style={styles.headerTitle}>Analiză Inteligentă IMOBI</Text>
          </View>
          <TouchableOpacity onPress={() => setIsVisible(false)}>
            <X size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {isAnalyzing ? (
          <View style={styles.analyzingContainer}>
            <Animated.View style={styles.spinning}>
              <RefreshCw size={24} color={theme.colors.secondary.main} />
            </Animated.View>
            <Text style={[styles.statusText, { color: theme.colors.textSecondary }]}>Analizăm conversația...</Text>
          </View>
        ) : (
          <>
            <View style={styles.summaryBox}>
              <Text style={[styles.summaryText, { color: theme.colors.textPrimary }]}>{summary}</Text>
            </View>

            <Text style={[styles.suggestLabel, { color: theme.colors.textSecondary }]}>Sugestie de răspuns:</Text>
            <TouchableOpacity 
              style={[styles.suggestionCard, { backgroundColor: `${theme.colors.secondary.main}10`, borderColor: theme.colors.secondary.main }]}
              onPress={() => onSuggestResponse?.("Sunt de acord cu ora 10:00. Îmi puteți trimite locația exactă?")}
            >
              <Text style={[styles.suggestionText, { color: theme.colors.textPrimary }]}>
                "Sunt de acord cu ora 10:00. Îmi puteți trimite locația exactă?"
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    right: 16,
    top: 130, // Below header
    zIndex: 100,
  },
  sparkleButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  container: {
    position: 'absolute',
    top: 110,
    left: 20,
    right: 20,
    borderRadius: 16,
    zIndex: 1000,
    overflow: 'hidden',
  },
  headerGradient: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  content: {
    padding: 16,
  },
  analyzingContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  spinning: {
    marginBottom: 12,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  summaryBox: {
    marginBottom: 16,
  },
  summaryText: {
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  suggestLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  suggestionCard: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  suggestionText: {
    fontSize: 14,
    lineHeight: 20,
  },
});

export default AIChatAnalysis;
