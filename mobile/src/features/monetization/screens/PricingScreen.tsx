/**
 * 💰 PRICING SCREEN
 *
 * Ecran pentru afișarea și achiziționarea planurilor de abonament.
 * Detectează automat platforma și folosește provider-ul corect:
 * - iOS: Apple IAP
 * - Android: Google Play Billing
 * - Web: PAYNET / MAIB / MPAY (Moldova)
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Check,
  X,
  Crown,
  Zap,
  Star,
  Sparkles,
  Building2,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';

import { useTheme } from '@/app/providers/ThemeProvider';
import { Button, ScreenHeader } from '@/shared/components';
import {
  usePayments,
  useSubscriptionPlans,
  useMonetizationStatus,
} from '../hooks/usePayments';
import { SubscriptionPlan, BillingCycle } from '../types';
import * as paymentService from '../services/paymentService';

// ============================================================================
// COMPONENT
// ============================================================================

const PricingScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();

  // State
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);

  // Hooks
  const { plans, isLoading: plansLoading, error: plansError } = useSubscriptionPlans();
  const { subscription, isLoading: statusLoading, refetch: refetchStatus } = useMonetizationStatus();
  const {
    state: paymentState,
    platformConfig,
    purchaseSubscription,
    getPayButtonText,
    formatPrice,
    resetState,
  } = usePayments();

  // Get icon for plan
  const getPlanIcon = (code: string, color: string) => {
    switch (code) {
      case 'free':
        return <Star size={32} color={color} />;
      case 'standard':
        return <Zap size={32} color={color} />;
      case 'premium':
        return <Crown size={32} color={color} />;
      case 'business':
        return <Building2 size={32} color={color} />;
      default:
        return <Star size={32} color={color} />;
    }
  };

  // Get gradient colors for plan
  const getPlanGradient = (code: string): string[] | undefined => {
    switch (code) {
      case 'standard':
        return [theme.colors.primary.main, theme.colors.primary.light];
      case 'premium':
        return [theme.colors.secondary.warning, '#d97706'];
      case 'business':
        return ['#7c3aed', '#a855f7'];
      default:
        return undefined;
    }
  };

  // Check if plan is current
  const isCurrentPlan = (plan: SubscriptionPlan): boolean => {
    if (!subscription) return plan.code === 'free';
    return subscription.plan?.code === plan.code;
  };

  // Handle subscribe
  const handleSubscribe = async (plan: SubscriptionPlan) => {
    if (isCurrentPlan(plan)) return;

    // Free plan - just show message
    if (plan.code === 'free') {
      Alert.alert(
        'Plan Gratuit',
        'Ești deja pe planul gratuit sau poți face downgrade după ce expiră abonamentul curent.',
      );
      return;
    }

    // Confirm purchase
    const price = billingCycle === 'yearly' ? plan.priceYearly : plan.priceMonthly;
    const priceText = formatPrice(price, plan.currency);
    const periodText = billingCycle === 'yearly' ? 'an' : 'lună';

    Alert.alert(
      `Abonament ${plan.name}`,
      `Dorești să te abonezi la planul ${plan.name} pentru ${priceText}/${periodText}?\n\n` +
        `Plata se va face prin ${paymentService.getProviderInfo(platformConfig.preferredProvider).name}.`,
      [
        { text: 'Anulează', style: 'cancel' },
        {
          text: 'Continuă',
          onPress: async () => {
            setSelectedPlanId(plan.id);
            const success = await purchaseSubscription(plan, billingCycle);

            if (success) {
              // Pentru providerii care nu necesită polling (Apple/Google),
              // succesul înseamnă că plata s-a finalizat
              if (!paymentState.requiresPolling) {
                Alert.alert(
                  'Succes! 🎉',
                  `Ai fost abonat la planul ${plan.name}!`,
                  [
                    {
                      text: 'OK',
                      onPress: () => {
                        refetchStatus();
                        resetState();
                      },
                    },
                  ],
                );
              } else {
                // Pentru PAYNET/MAIB/MPAY, utilizatorul a fost redirecționat
                Alert.alert(
                  'Redirecționare',
                  'Vei fi redirecționat către pagina de plată. După finalizare, revino în aplicație.',
                );
              }
            } else if (paymentState.error) {
              Alert.alert('Eroare', paymentState.error);
            }

            setSelectedPlanId(null);
          },
        },
      ],
    );
  };

  // Get button text for plan
  const getButtonText = (plan: SubscriptionPlan): string => {
    if (isCurrentPlan(plan)) return 'Plan Curent';
    if (plan.code === 'free') return 'Downgrade';
    if (plan.trialDays > 0 && !subscription) return `Încearcă ${plan.trialDays} zile gratis`;
    return 'Upgrade Acum';
  };

  // Loading state
  if (plansLoading || statusLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        edges={['top']}
      >
        <ScreenHeader title="Planuri și Prețuri" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary.main} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            Se încarcă planurile...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (plansError) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        edges={['top']}
      >
        <ScreenHeader title="Planuri și Prețuri" />
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.colors.secondary.error }]}>
            {plansError}
          </Text>
          <Button title="Reîncearcă" onPress={() => {}} variant="secondary" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      <ScreenHeader title="Planuri și Prețuri" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        horizontal={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        alwaysBounceHorizontal={false}
        directionalLockEnabled
      >
        {/* Hero Section */}
        <View style={[styles.heroSection, { paddingHorizontal: theme.spacing[4] }]}>
          <Sparkles size={48} color={theme.colors.primary.main} />
          <Text
            style={[
              styles.heroTitle,
              {
                color: theme.colors.textPrimary,
                fontSize: theme.typography.fontSize['3xl'],
                marginTop: theme.spacing[4],
              },
            ]}
          >
            Alege planul potrivit
          </Text>
          <Text
            style={[
              styles.heroSubtitle,
              {
                color: theme.colors.textSecondary,
                fontSize: theme.typography.fontSize.base,
                marginTop: theme.spacing[2],
              },
            ]}
          >
            Publică anunțuri și ajunge la mii de căutători
          </Text>

          {/* Current subscription info */}
          {subscription && (
            <View
              style={[
                styles.currentPlanBadge,
                {
                  backgroundColor: theme.colors.accent.main + '20',
                  marginTop: theme.spacing[3],
                  paddingVertical: theme.spacing[2],
                  paddingHorizontal: theme.spacing[3],
                  borderRadius: theme.borderRadius.lg,
                },
              ]}
            >
              <Text style={[styles.currentPlanText, { color: theme.colors.accent.main }]}>
                Plan curent: {subscription.plan?.name || 'Gratuit'}
              </Text>
            </View>
          )}
        </View>

        {/* Billing Toggle */}
        <View style={[styles.billingToggle, { marginHorizontal: theme.spacing[4] }]}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              {
                backgroundColor:
                  billingCycle === 'monthly'
                    ? theme.colors.primary.main
                    : theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
            onPress={() => setBillingCycle('monthly')}
          >
            <Text
              style={[
                styles.toggleText,
                {
                  color:
                    billingCycle === 'monthly'
                      ? theme.colors.surface
                      : theme.colors.textSecondary,
                  fontSize: theme.typography.fontSize.sm,
                },
              ]}
            >
              Lunar
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              {
                backgroundColor:
                  billingCycle === 'yearly'
                    ? theme.colors.primary.main
                    : theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
            onPress={() => setBillingCycle('yearly')}
          >
            <View style={styles.toggleContent}>
              <Text
                style={[
                  styles.toggleText,
                  {
                    color:
                      billingCycle === 'yearly'
                        ? theme.colors.surface
                        : theme.colors.textSecondary,
                    fontSize: theme.typography.fontSize.sm,
                  },
                ]}
              >
                Anual
              </Text>
              <View
                style={[
                  styles.discountBadge,
                  {
                    backgroundColor:
                      billingCycle === 'yearly'
                        ? 'rgba(255, 255, 255, 0.2)'
                        : theme.colors.accent.main + '20',
                  },
                ]}
              >
                <Text style={[styles.discountText, { color: theme.colors.accent.main }]}>
                  -20%
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Provider Info */}
        <View
          style={[
            styles.providerInfo,
            {
              backgroundColor: theme.colors.surface,
              marginHorizontal: theme.spacing[4],
              marginBottom: theme.spacing[4],
              padding: theme.spacing[3],
              borderRadius: theme.borderRadius.lg,
              borderWidth: 1,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Text style={[styles.providerText, { color: theme.colors.textSecondary }]}>
            💳 Plata se face prin{' '}
            <Text style={{ fontWeight: '600', color: theme.colors.textPrimary }}>
              {paymentService.getProviderInfo(platformConfig.preferredProvider).name}
            </Text>
          </Text>
        </View>

        {/* Pricing Cards */}
        <View style={styles.plansContainer}>
          {plans.map((plan) => {
            const gradient = getPlanGradient(plan.code);
            const isCurrent = isCurrentPlan(plan);
            const isPopular = plan.code === 'premium';
            const isProcessing = paymentState.isProcessing && selectedPlanId === plan.id;
            const price = billingCycle === 'yearly' ? plan.priceYearly : plan.priceMonthly;

            return (
              <View
                key={plan.id}
                style={[
                  styles.planCard,
                  {
                    backgroundColor: theme.colors.surface,
                    marginHorizontal: theme.spacing[4],
                    marginBottom: theme.spacing[4],
                    borderWidth: isPopular ? 2 : 1,
                    borderColor: isPopular
                      ? theme.colors.secondary.warning
                      : isCurrent
                      ? theme.colors.accent.main
                      : theme.colors.border,
                    ...theme.shadows.md,
                  },
                ]}
              >
                {/* Popular Badge */}
                {isPopular && (
                  <View style={styles.popularBadgeContainer}>
                    <View
                      style={[
                        styles.popularBadge,
                        { backgroundColor: theme.colors.secondary.warning },
                      ]}
                    >
                      <Text style={[styles.popularBadgeText, { color: theme.colors.surface }]}>
                        CEL MAI POPULAR
                      </Text>
                    </View>
                  </View>
                )}

                {/* Current Badge */}
                {isCurrent && !isPopular && (
                  <View style={styles.popularBadgeContainer}>
                    <View
                      style={[
                        styles.popularBadge,
                        { backgroundColor: theme.colors.accent.main },
                      ]}
                    >
                      <Text style={[styles.popularBadgeText, { color: theme.colors.surface }]}>
                        PLAN CURENT
                      </Text>
                    </View>
                  </View>
                )}

                {/* Plan Header */}
                <View style={styles.planHeader}>
                  {gradient ? (
                    <LinearGradient
                      colors={gradient as [string, string, ...string[]]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.iconContainer}
                    >
                      <View style={styles.iconWrapper}>
                        {getPlanIcon(plan.code, theme.colors.surface)}
                      </View>
                    </LinearGradient>
                  ) : (
                    <View
                      style={[
                        styles.iconContainer,
                        { backgroundColor: theme.colors.textTertiary + '20' },
                      ]}
                    >
                      {getPlanIcon(plan.code, theme.colors.textSecondary)}
                    </View>
                  )}
                  <Text
                    style={[
                      styles.planName,
                      {
                        color: theme.colors.textPrimary,
                        fontSize: theme.typography.fontSize.xl,
                        marginTop: theme.spacing[3],
                      },
                    ]}
                  >
                    {plan.name}
                  </Text>
                </View>

                {/* Price */}
                <View style={[styles.priceContainer, { marginTop: theme.spacing[4] }]}>
                  <Text
                    style={[
                      styles.price,
                      {
                        color: gradient ? gradient[0] : theme.colors.textSecondary,
                        fontSize: theme.typography.fontSize['4xl'],
                      },
                    ]}
                  >
                    {formatPrice(price, plan.currency)}
                  </Text>
                  <Text
                    style={[
                      styles.period,
                      {
                        color: theme.colors.textSecondary,
                        fontSize: theme.typography.fontSize.sm,
                      },
                    ]}
                  >
                    /lună
                  </Text>
                </View>

                {/* Savings text */}
                {billingCycle === 'yearly' && price > 0 && (
                  <Text
                    style={[
                      styles.savingsText,
                      {
                        color: theme.colors.accent.main,
                        fontSize: theme.typography.fontSize.xs,
                        marginTop: theme.spacing[1],
                      },
                    ]}
                  >
                    Economisești {formatPrice(paymentService.calculateYearlySavings(plan), plan.currency)}/an
                  </Text>
                )}

                {/* Features */}
                <View style={[styles.featuresContainer, { marginTop: theme.spacing[5] }]}>
                  <FeatureRow
                    included={true}
                    text={`${plan.maxActiveListings} anunțuri active`}
                    theme={theme}
                  />
                  <FeatureRow
                    included={true}
                    text={`${plan.maxPhotosPerListing} fotografii/anunț`}
                    theme={theme}
                  />
                  {plan.freeMonthlyBoosts > 0 && (
                    <FeatureRow
                      included={true}
                      text={`${plan.freeMonthlyBoosts} boost-uri gratuite/lună`}
                      theme={theme}
                    />
                  )}
                  <FeatureRow
                    included={plan.hasVideoTour}
                    text="Video tour"
                    theme={theme}
                  />
                  <FeatureRow
                    included={plan.hasPrioritySearch}
                    text="Prioritate în căutări"
                    theme={theme}
                  />
                  <FeatureRow
                    included={plan.hasAdvancedStats}
                    text="Statistici avansate"
                    theme={theme}
                  />
                  <FeatureRow
                    included={plan.hasAiFeatures}
                    text="Funcții AI"
                    theme={theme}
                  />
                </View>

                {/* CTA Button */}
                <Button
                  title={isProcessing ? 'Se procesează...' : getButtonText(plan)}
                  onPress={() => handleSubscribe(plan)}
                  variant={isPopular ? 'primary' : 'secondary'}
                  fullWidth
                  style={{ marginTop: theme.spacing[5] }}
                  disabled={isCurrent || isProcessing || paymentState.isProcessing}
                />
              </View>
            );
          })}
        </View>

        {/* FAQ Section */}
        <View
          style={[
            styles.faqSection,
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
              styles.faqTitle,
              {
                color: theme.colors.textPrimary,
                fontSize: theme.typography.fontSize.lg,
                marginBottom: theme.spacing[3],
              },
            ]}
          >
            Întrebări Frecvente
          </Text>
          <Text
            style={[
              styles.faqText,
              {
                color: theme.colors.textSecondary,
                fontSize: theme.typography.fontSize.sm,
                lineHeight: 20,
              },
            ]}
          >
            • Poți anula subscripția oricând{'\n'}
            • Perioada de probă de 14 zile fără card{'\n'}
            • Downgrade automat la planul gratuit{'\n'}
            • Facturi generate automat lunar
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// ============================================================================
// FEATURE ROW COMPONENT
// ============================================================================

interface FeatureRowProps {
  included: boolean;
  text: string;
  theme: any;
}

const FeatureRow: React.FC<FeatureRowProps> = ({ included, text, theme }) => (
  <View style={styles.featureRow}>
    {included ? (
      <Check size={18} color={theme.colors.accent.main} />
    ) : (
      <X size={18} color={theme.colors.textTertiary} />
    )}
    <Text
      style={[
        styles.featureText,
        {
          color: included ? theme.colors.textPrimary : theme.colors.textTertiary,
          fontSize: theme.typography.fontSize.sm,
        },
      ]}
    >
      {text}
    </Text>
  </View>
);

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
    width: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
  heroSection: {
    paddingTop: 32,
    paddingBottom: 24,
    alignItems: 'center',
  },
  heroTitle: {
    fontWeight: '700',
    textAlign: 'center',
  },
  heroSubtitle: {
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },
  currentPlanBadge: {},
  currentPlanText: {
    fontWeight: '600',
    fontSize: 14,
  },
  billingToggle: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    gap: 8,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  toggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  toggleText: {
    fontWeight: '600',
  },
  discountBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  discountText: {
    fontSize: 11,
    fontWeight: '700',
  },
  providerInfo: {},
  providerText: {
    fontSize: 14,
    textAlign: 'center',
  },
  plansContainer: {
    marginTop: 8,
  },
  planCard: {
    borderRadius: 20,
    padding: 24,
    position: 'relative',
  },
  popularBadgeContainer: {
    position: 'absolute',
    top: -12,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1,
  },
  popularBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
  },
  popularBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  planHeader: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  planName: {
    fontWeight: '700',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
  },
  price: {
    fontWeight: '700',
  },
  period: {
    fontWeight: '400',
    marginLeft: 4,
  },
  savingsText: {
    textAlign: 'center',
    fontWeight: '600',
  },
  featuresContainer: {
    gap: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    flex: 1,
    lineHeight: 20,
  },
  faqSection: {},
  faqTitle: {
    fontWeight: '600',
  },
  faqText: {},
});

export default PricingScreen;
