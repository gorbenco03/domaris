/**
 * IMOBI - Verification Hub Screen
 * Main screen for identity verification (KYC)
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Shield, CheckCircle, Clock, AlertCircle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';

import { useTheme } from '@/app/providers/ThemeProvider';
import { Button } from '@/shared/components';

interface VerificationLevel {
  level: 0 | 1 | 2 | 3;
  label: string;
  description: string;
  badge: string;
  requirements: string[];
  capabilities: string[];
  status: 'locked' | 'available' | 'pending' | 'verified' | 'rejected';
}

const VerificationHubScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();

  // Mock verification status - in production, this would come from backend
  const currentLevel = 1;
  
  const verificationLevels: VerificationLevel[] = [
    {
      level: 0,
      label: 'Cont Nou',
      description: 'Contul tău nu este încă verificat',
      badge: '',
      requirements: ['Cont creat'],
      capabilities: ['Vizualizare proprietăți'],
      status: currentLevel >= 0 ? 'verified' : 'locked',
    },
    {
      level: 1,
      label: 'Verificat Email/Telefon',
      description: 'Verificare de bază completată',
      badge: '✓ Verificat',
      requirements: ['Email verificat', 'Telefon verificat'],
      capabilities: ['Căutare', 'Favorite', 'Contact proprietari'],
      status: currentLevel >= 1 ? 'verified' : (currentLevel >= 0 ? 'available' : 'locked'),
    },
    {
      level: 2,
      label: 'Identitate Verificată',
      description: 'Verificare completă a identității',
      badge: '✓✓ Identitate',
      requirements: ['Document identitate', 'Selfie verificare', 'Matching facial'],
      capabilities: ['Postare anunțuri', 'Aprobare rapidă', 'Încredere maximă'],
      status: currentLevel >= 2 ? 'verified' : (currentLevel >= 1 ? 'available' : 'locked'),
    },
    {
      level: 3,
      label: 'Proprietar Verificat',
      description: 'Proprietar confirmat cu documente',
      badge: '🏠 Proprietar',
      requirements: ['Nivel 2 completat', 'Document proprietate', 'Extras CF sau Contract'],
      capabilities: ['Badge special', 'Prioritate în căutări', 'Încredere premium'],
      status: currentLevel >= 3 ? 'verified' : (currentLevel >= 2 ? 'available' : 'locked'),
    },
  ];

  const getStatusIcon = (status: VerificationLevel['status']) => {
    switch (status) {
      case 'verified':
        return <CheckCircle size={20} color={theme.colors.accent.main} />;
      case 'pending':
        return <Clock size={20} color={theme.colors.secondary.warning} />;
      case 'rejected':
        return <AlertCircle size={20} color={theme.colors.secondary.error} />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: VerificationLevel['status']) => {
    switch (status) {
      case 'verified':
        return theme.colors.accent.main;
      case 'pending':
        return theme.colors.secondary.warning;
      case 'rejected':
        return theme.colors.secondary.error;
      case 'available':
        return theme.colors.primary.main;
      default:
        return theme.colors.textTertiary;
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
        <Text
          style={[
            styles.headerTitle,
            {
              color: theme.colors.textPrimary,
              fontSize: theme.typography.fontSize.lg,
            },
          ]}
        >
          Verificare Identitate
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={[styles.heroSection, { paddingHorizontal: theme.spacing[4] }]}>
          <View style={[styles.heroIcon, { backgroundColor: theme.colors.primary.main + '15' }]}>
            <Shield size={48} color={theme.colors.primary.main} />
          </View>
          <Text
            style={[
              styles.heroTitle,
              {
                color: theme.colors.textPrimary,
                fontSize: theme.typography.fontSize['3xl'],
              },
            ]}
          >
            Construiește Încredere
          </Text>
          <Text
            style={[
              styles.heroSubtitle,
              {
                color: theme.colors.textSecondary,
                fontSize: theme.typography.fontSize.base,
              },
            ]}
          >
            Verifică-ți identitatea pentru access complet la toate funcțiile IMOBI
          </Text>

          {/* Current Level Badge */}
          <LinearGradient
            colors={[theme.colors.accent.main, theme.colors.accent.dark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.currentLevelBadge, { marginTop: theme.spacing[6] }]}
          >
            <Text style={styles.currentLevelText}>
              Nivel Curent: {verificationLevels[currentLevel].label}
            </Text>
            <Text style={styles.currentLevelBadge}>
              {verificationLevels[currentLevel].badge}
            </Text>
          </LinearGradient>
        </View>

        {/* Verification Levels */}
        <View style={[styles.levelsSection, { paddingHorizontal: theme.spacing[4] }]}>
          <Text
            style={[
              styles.sectionTitle,
              {
                color: theme.colors.textPrimary,
                fontSize: theme.typography.fontSize.xl,
                marginBottom: theme.spacing[4],
              },
            ]}
          >
            Niveluri de Verificare
          </Text>

          {verificationLevels.map((level, index) => (
            <View
              key={level.level}
              style={[
                styles.levelCard,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor:
                    level.status === 'verified'
                      ? theme.colors.accent.main
                      : theme.colors.border,
                  borderWidth: level.status === 'verified' ? 2 : 1,
                  marginBottom: theme.spacing[4],
                  ...theme.shadows.card,
                },
              ]}
            >
              {/* Level Header */}
              <View style={styles.levelHeader}>
                <View style={styles.levelInfo}>
                  <View style={styles.levelTitleRow}>
                    <Text
                      style={[
                        styles.levelLabel,
                        {
                          color: getStatusColor(level.status),
                          fontSize: theme.typography.fontSize.lg,
                        },
                      ]}
                    >
                      Nivel {level.level}
                    </Text>
                    {getStatusIcon(level.status)}
                  </View>
                  <Text
                    style={[
                      styles.levelTitle,
                      {
                        color: theme.colors.textPrimary,
                        fontSize: theme.typography.fontSize.xl,
                      },
                    ]}
                  >
                    {level.label}
                  </Text>
                  {level.badge && (
                    <View
                      style={[
                        styles.badgeContainer,
                        { backgroundColor: theme.colors.accent.main + '15' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeText,
                          { color: theme.colors.accent.main },
                        ]}
                      >
                        {level.badge}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Description */}
              <Text
                style={[
                  styles.levelDescription,
                  {
                    color: theme.colors.textSecondary,
                    fontSize: theme.typography.fontSize.sm,
                  },
                ]}
              >
                {level.description}
              </Text>

              {/* Requirements */}
              <View style={styles.section}>
                <Text
                  style={[
                    styles.subsectionTitle,
                    {
                      color: theme.colors.textPrimary,
                      fontSize: theme.typography.fontSize.sm,
                    },
                  ]}
                >
                  Cerințe:
                </Text>
                {level.requirements.map((req, idx) => (
                  <View key={idx} style={styles.listItem}>
                    <CheckCircle
                      size={16}
                      color={
                        level.status === 'verified'
                          ? theme.colors.accent.main
                          : theme.colors.textTertiary
                      }
                    />
                    <Text
                      style={[
                        styles.listItemText,
                        {
                          color: theme.colors.textSecondary,
                          fontSize: theme.typography.fontSize.sm,
                        },
                      ]}
                    >
                      {req}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Capabilities */}
              <View style={styles.section}>
                <Text
                  style={[
                    styles.subsectionTitle,
                    {
                      color: theme.colors.textPrimary,
                      fontSize: theme.typography.fontSize.sm,
                    },
                  ]}
                >
                  Capabilități:
                </Text>
                {level.capabilities.map((cap, idx) => (
                  <View key={idx} style={styles.listItem}>
                    <Text style={styles.bullet}>•</Text>
                    <Text
                      style={[
                        styles.listItemText,
                        {
                          color: theme.colors.textSecondary,
                          fontSize: theme.typography.fontSize.sm,
                        },
                      ]}
                    >
                      {cap}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Action Button */}
              {level.status === 'available' && (
                <Button
                  title={`Începe Verificarea Nivel ${level.level}`}
                  onPress={() => {/* Navigate to verification flow */}}
                  variant="primary"
                  fullWidth
                  style={{ marginTop: theme.spacing[4] }}
                />
              )}
              
              {level.status === 'pending' && (
                <View
                  style={[
                    styles.statusBanner,
                    { backgroundColor: theme.colors.secondary.warning + '15' },
                  ]}
                >
                  <Clock size={16} color={theme.colors.secondary.warning} />
                  <Text
                    style={[
                      styles.statusText,
                      {
                        color: theme.colors.secondary.warning,
                        fontSize: theme.typography.fontSize.sm,
                      },
                    ]}
                  >
                    În curs de verificare (~ 5 minute)
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Security Info */}
        <View
          style={[
            styles.securitySection,
            {
              backgroundColor: theme.colors.primary.main + '08',
              marginHorizontal: theme.spacing[4],
              marginBottom: theme.spacing[6],
              padding: theme.spacing[4],
              borderRadius: theme.borderRadius.xl,
            },
          ]}
        >
          <Text
            style={[
              styles.securityTitle,
              {
                color: theme.colors.textPrimary,
                fontSize: theme.typography.fontSize.base,
              },
            ]}
          >
            🔒 Securitate și Confidențialitate
          </Text>
          <Text
            style={[
              styles.securityText,
              {
                color: theme.colors.textSecondary,
                fontSize: theme.typography.fontSize.sm,
              },
            ]}
          >
            Documentele tale sunt criptate AES-256 și respectăm complet GDPR.
            Datele sunt păstrate doar pentru verificare și pot fi șterse oricând la cerere.
          </Text>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  heroSection: {
    paddingTop: 32,
    paddingBottom: 24,
    alignItems: 'center',
  },
  heroIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  heroSubtitle: {
    textAlign: 'center',
    lineHeight: 24,
  },
  currentLevelBadge: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  currentLevelText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  levelsSection: {
    paddingTop: 24,
  },
  sectionTitle: {
    fontWeight: '600',
  },
  levelCard: {
    borderRadius: 16,
    padding: 20,
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  levelInfo: {
    flex: 1,
  },
  levelTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  levelLabel: {
    fontWeight: '600',
  },
  levelTitle: {
    fontWeight: '700',
    marginBottom: 8,
  },
  badgeContainer: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  levelDescription: {
    marginBottom: 16,
    lineHeight: 20,
  },
  section: {
    marginBottom: 12,
  },
  subsectionTitle: {
    fontWeight: '600',
    marginBottom: 8,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  bullet: {
    fontSize: 16,
    lineHeight: 16,
  },
  listItemText: {
    flex: 1,
    lineHeight: 20,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  statusText: {
    fontWeight: '500',
  },
  securitySection: {
    marginTop: 8,
  },
  securityTitle: {
    fontWeight: '600',
    marginBottom: 8,
  },
  securityText: {
    lineHeight: 20,
  },
});

export default VerificationHubScreen;
