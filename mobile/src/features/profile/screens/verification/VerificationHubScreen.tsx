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
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Shield, CheckCircle, Clock, AlertCircle, Lock, ChevronRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';

import { useTheme } from '@/app/providers/ThemeProvider';
import { useAuth } from '@/app/providers/AuthProvider';
import { useKycStatus } from '@/features/kyc/hooks/useKyc';
import { Button, ScreenHeader } from '@/shared/components';

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
  const { user } = useAuth();
  const { data: kycStatus, isLoading } = useKycStatus();

  const currentLevel = kycStatus?.currentLevel ?? user?.verificationLevel ?? 0;
  const activeStatus = kycStatus?.status ?? 'NOT_STARTED';
  const targetLevel = kycStatus?.targetLevel ?? null;
  const rejectionReason = kycStatus?.rejectionReason ?? null;
  
  const resolveStatus = (level: VerificationLevel['level']): VerificationLevel['status'] => {
    if (level === 0) {
      return 'verified';
    }

    if (level === 1) {
      return currentLevel >= 1 ? 'verified' : 'available';
    }

    if (currentLevel >= level) {
      return 'verified';
    }

    if (targetLevel === level && ['PENDING', 'IN_REVIEW'].includes(activeStatus)) {
      return 'pending';
    }

    if (targetLevel === level && activeStatus === 'REJECTED') {
      return 'rejected';
    }

    if (level === 2 && currentLevel >= 1) {
      return 'available';
    }

    if (level === 3 && currentLevel >= 2) {
      return 'available';
    }

    return 'locked';
  };

  const handleStartVerification = (level: number) => {
    if (level === 2) {
      navigation.navigate('IdentityVerification' as never);
      return;
    }
    if (level === 3) {
      navigation.navigate('OwnershipVerification' as never);
      return;
    }
    Alert.alert('Info', 'Acest nivel se activează automat după OTP.');
  };

  const verificationLevels: VerificationLevel[] = [
    {
      level: 0,
      label: 'Cont Nou',
      description: 'Contul tău nu este încă verificat',
      badge: '',
      requirements: ['Cont creat'],
      capabilities: ['Vizualizare proprietăți'],
      status: resolveStatus(0),
    },
    {
      level: 1,
      label: 'Verificat Email/Telefon',
      description: 'Verificare de bază completată',
      badge: '✓ Verificat',
      requirements: ['Email verificat', 'Telefon verificat'],
      capabilities: ['Căutare', 'Favorite'],
      status: resolveStatus(1),
    },
    {
      level: 2,
      label: 'Identitate Verificată',
      description: 'Verificare completă a identității',
      badge: '✓✓ Identitate',
      requirements: ['Document identitate', 'Selfie verificare'],
      capabilities: ['Contact proprietari', 'Mesaje', 'Cereri vizionare'],
      status: resolveStatus(2),
    },
    {
      level: 3,
      label: 'Proprietar Verificat',
      description: 'Proprietar confirmat cu documente',
      badge: 'Proprietar Verificat',
      requirements: ['Nivel 2 completat', 'Document proprietate'],
      capabilities: ['Postare anunțuri', 'Badge special', 'Încredere premium'],
      status: resolveStatus(3),
    },
  ];

  const getStatusIcon = (status: VerificationLevel['status'], size: number = 20) => {
    switch (status) {
      case 'verified':
        return <CheckCircle size={size} color={theme.colors.accent.main} />;
      case 'pending':
        return <Clock size={size} color={theme.colors.secondary.warning} />;
      case 'rejected':
        return <AlertCircle size={size} color={theme.colors.secondary.error} />;
      case 'locked':
        return <Lock size={size} color={theme.colors.textTertiary} />;
      case 'available':
        return <ChevronRight size={size} color={theme.colors.primary.main} />;
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
      <ScreenHeader title="Verificare Identitate" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoading && (
          <View style={{ alignItems: 'center', marginBottom: theme.spacing[4] }}>
            <ActivityIndicator color={theme.colors.primary.main} />
          </View>
        )}
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
          <View
            style={[
              styles.currentLevelBadge,
              {
                backgroundColor: theme.colors.accent.main,
                marginTop: theme.spacing[5],
              },
            ]}
          >
            <CheckCircle size={16} color="#ffffff" />
            <Text style={styles.currentLevelText}>
              Nivel {currentLevel}: {verificationLevels[currentLevel].label}
            </Text>
          </View>
        </View>

        {/* Verification Levels */}
        <View style={styles.levelsSection}>
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
            Niveluri de Verificare
          </Text>

          {verificationLevels.map((level) => {
            const isLocked = level.status === 'locked';
            const isVerified = level.status === 'verified';
            const isAvailable = level.status === 'available';
            const isPending = level.status === 'pending';
            const isRejected = level.status === 'rejected';

            return (
              <View
                key={level.level}
                style={[
                  styles.levelCard,
                  {
                    backgroundColor: theme.colors.surface,
                    borderLeftColor: isVerified
                      ? theme.colors.accent.main
                      : isAvailable
                      ? theme.colors.primary.main
                      : isPending
                      ? theme.colors.secondary.warning
                      : theme.colors.border,
                    marginHorizontal: theme.spacing[4],
                    marginBottom: theme.spacing[3],
                    opacity: isLocked ? 0.5 : 1,
                    ...theme.shadows.sm,
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
                            color: isVerified
                              ? theme.colors.accent.main
                              : isAvailable
                              ? theme.colors.primary.main
                              : theme.colors.textTertiary,
                            fontSize: theme.typography.fontSize.xs,
                          },
                        ]}
                      >
                        NIVEL {level.level}
                      </Text>
                      {isVerified && (
                        <CheckCircle size={14} color={theme.colors.accent.main} />
                      )}
                      {isLocked && (
                        <Lock size={12} color={theme.colors.textTertiary} />
                      )}
                    </View>
                    <Text
                      style={[
                        styles.levelTitle,
                        {
                          color: isLocked
                            ? theme.colors.textTertiary
                            : theme.colors.textPrimary,
                          fontSize: theme.typography.fontSize.base,
                        },
                      ]}
                    >
                      {level.label}
                    </Text>
                  </View>
                </View>

                {/* Content - Only for non-locked */}
                {!isLocked && (
                  <>
                    <Text
                      style={[
                        styles.levelDescription,
                        {
                          color: theme.colors.textSecondary,
                          fontSize: theme.typography.fontSize.sm,
                          marginTop: theme.spacing[2],
                        },
                      ]}
                    >
                      {level.description}
                    </Text>

                    {/* Requirements */}
                    <View style={[styles.requirementsList, { marginTop: theme.spacing[3] }]}>
                      {level.requirements.map((req, idx) => (
                        <View key={idx} style={styles.requirementItem}>
                          <CheckCircle
                            size={14}
                            color={
                              isVerified
                                ? theme.colors.accent.main
                                : theme.colors.textTertiary
                            }
                          />
                          <Text
                            style={[
                              styles.requirementText,
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

                    {/* Action Button for Available */}
                    {isAvailable && (
                      <Button
                        title="Începe Verificarea"
                        onPress={() => handleStartVerification(level.level)}
                        variant="primary"
                        fullWidth
                        style={{ marginTop: theme.spacing[4] }}
                      />
                    )}

                    {isRejected && (
                      <Button
                        title="Retrimite Documente"
                        onPress={() => handleStartVerification(level.level)}
                        variant="primary"
                        fullWidth
                        style={{ marginTop: theme.spacing[4] }}
                      />
                    )}

                    {/* Status Banner */}
                    {isPending && (
                      <View
                        style={[
                          styles.statusBanner,
                          {
                            backgroundColor: theme.colors.secondary.warning + '10',
                            marginTop: theme.spacing[3],
                          },
                        ]}
                      >
                        <Clock size={14} color={theme.colors.secondary.warning} />
                        <Text
                          style={[
                            styles.statusText,
                            {
                              color: theme.colors.secondary.warning,
                              fontSize: theme.typography.fontSize.xs,
                            },
                          ]}
                        >
                          În curs de verificare
                        </Text>
                      </View>
                    )}

                    {isRejected && rejectionReason && (
                      <View
                        style={[
                          styles.statusBanner,
                          {
                            backgroundColor: theme.colors.secondary.error + '10',
                            marginTop: theme.spacing[3],
                          },
                        ]}
                      >
                        <AlertCircle size={14} color={theme.colors.secondary.error} />
                        <Text
                          style={[
                            styles.statusText,
                            {
                              color: theme.colors.secondary.error,
                              fontSize: theme.typography.fontSize.xs,
                            },
                          ]}
                        >
                          {rejectionReason}
                        </Text>
                      </View>
                    )}
                  </>
                )}

                {/* Locked Message */}
                {isLocked && (
                  <Text
                    style={[
                      styles.lockedText,
                      {
                        color: theme.colors.textTertiary,
                        fontSize: theme.typography.fontSize.xs,
                        marginTop: theme.spacing[1],
                      },
                    ]}
                  >
                    Finalizează nivelul anterior
                  </Text>
                )}
              </View>
            );
          })}
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
            Securitate și Confidențialitate
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  heroSection: {
    paddingTop: 24,
    paddingBottom: 24,
    alignItems: 'center',
  },
  heroIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
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
    lineHeight: 22,
    maxWidth: 280,
  },
  currentLevelBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  currentLevelText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  levelsSection: {
    paddingTop: 8,
  },
  sectionTitle: {
    fontWeight: '600',
  },
  levelCard: {
    borderRadius: 12,
    borderLeftWidth: 4,
    padding: 16,
  },
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  levelInfo: {
    flex: 1,
  },
  levelTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  levelLabel: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  levelTitle: {
    fontWeight: '600',
  },
  levelDescription: {
    lineHeight: 20,
  },
  requirementsList: {
    gap: 6,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  requirementText: {
    flex: 1,
    lineHeight: 20,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  statusText: {
    fontWeight: '500',
  },
  lockedText: {},
  securitySection: {},
  securityTitle: {
    fontWeight: '600',
    marginBottom: 8,
  },
  securityText: {
    lineHeight: 20,
  },
});

export default VerificationHubScreen;
