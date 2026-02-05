/**
 * PricingScreen - Subscription plans and pricing
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  LayoutAnimation,
  UIManager,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Check,
  X,
  Crown,
  Zap,
  Star,
  ChevronDown,
  ChevronUp,
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

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ============================================================================
// PLAN CARD GRADIENTS
// ============================================================================

const PLAN_GRADIENTS: Record<string, [string, string]> = {
  free: ['#6B7280', '#9CA3AF'],
  standard: ['#3B82F6', '#60A5FA'],
  premium: ['#F59E0B', '#D97706'],
};

// ============================================================================
// COMPONENT
// ============================================================================

const PricingScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();

  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const { plans, isLoading: plansLoading, error: plansError } = useSubscriptionPlans();
  const { subscription, isLoading: statusLoading, refetch: refetchStatus } = useMonetizationStatus();
  const {
    state: paymentState,
    platformConfig,
    purchaseSubscription,
    formatPrice,
    resetState,
  } = usePayments();

  const getPlanIcon = (code: string, size: number, color: string) => {
    switch (code) {
      case 'free':
        return <Star size={size} color={color} />;
      case 'standard':
        return <Zap size={size} color={color} />;
      case 'premium':
        return <Crown size={size} color={color} />;
      default:
        return <Star size={size} color={color} />;
    }
  };

  const isCurrentPlan = (plan: SubscriptionPlan): boolean => {
    if (!subscription) return plan.code === 'free';
    return subscription.plan?.code === plan.code;
  };

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    if (isCurrentPlan(plan)) return;

    if (plan.code === 'free') {
      Alert.alert(
        'Plan Gratuit',
        'Ești deja pe planul gratuit sau poți face downgrade după ce expiră abonamentul curent.',
      );
      return;
    }

    const price = billingCycle === 'yearly' ? plan.priceYearly : plan.priceMonthly;
    const priceText = formatPrice(price, plan.currency);
    const periodText = billingCycle === 'yearly' ? 'an' : 'lună';

    Alert.alert(
      `Abonament ${plan.name}`,
      `Dorești să te abonezi la planul ${plan.name} pentru ${priceText}/${periodText}?`,
      [
        { text: 'Anulează', style: 'cancel' },
        {
          text: 'Continuă',
          onPress: async () => {
            setSelectedPlanId(plan.id);
            const success = await purchaseSubscription(plan, billingCycle);

            if (success) {
              if (!paymentState.requiresPolling) {
                Alert.alert(
                  'Succes!',
                  `Ai fost abonat la planul ${plan.name}!`,
                  [{ text: 'OK', onPress: () => { refetchStatus(); resetState(); } }],
                );
              } else {
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

  const getButtonText = (plan: SubscriptionPlan): string => {
    if (isCurrentPlan(plan)) return 'Plan curent';
    if (plan.code === 'free') return 'Downgrade';
    if (plan.trialDays > 0 && !subscription) return `${plan.trialDays} zile gratis`;
    return 'Alege planul';
  };

  const toggleFaq = (index: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedFaq(expandedFaq === index ? null : index);
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

  const currentPlanName = subscription?.plan?.name || 'Gratuit';

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      <ScreenHeader title="Planuri și Prețuri" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Compact Header */}
        <View style={styles.headerSection}>
          <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>
            Alege planul potrivit
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
            Publică anunțuri și ajunge la mii de căutători
          </Text>
          <View
            style={[
              styles.currentPlanChip,
              { backgroundColor: theme.colors.primary.main + '15' },
            ]}
          >
            <Check size={14} color={theme.colors.primary.main} />
            <Text style={[styles.currentPlanChipText, { color: theme.colors.primary.main }]}>
              Plan curent: {currentPlanName}
            </Text>
          </View>
        </View>

        {/* Billing Toggle - Pill Style */}
        <View
          style={[
            styles.billingToggleContainer,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.billingPill,
              billingCycle === 'monthly' && {
                backgroundColor: theme.colors.primary.main,
              },
            ]}
            onPress={() => setBillingCycle('monthly')}
          >
            <Text
              style={[
                styles.billingPillText,
                {
                  color: billingCycle === 'monthly' ? '#fff' : theme.colors.textSecondary,
                },
              ]}
            >
              Lunar
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.billingPill,
              billingCycle === 'yearly' && {
                backgroundColor: theme.colors.primary.main,
              },
            ]}
            onPress={() => setBillingCycle('yearly')}
          >
            <Text
              style={[
                styles.billingPillText,
                {
                  color: billingCycle === 'yearly' ? '#fff' : theme.colors.textSecondary,
                },
              ]}
            >
              Anual
            </Text>
            <View
              style={[
                styles.discountChip,
                {
                  backgroundColor:
                    billingCycle === 'yearly'
                      ? 'rgba(255,255,255,0.25)'
                      : theme.colors.accent.main + '20',
                },
              ]}
            >
              <Text
                style={[
                  styles.discountChipText,
                  {
                    color: billingCycle === 'yearly' ? '#fff' : theme.colors.accent.main,
                  },
                ]}
              >
                -20%
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Plan Cards */}
        <View style={styles.plansContainer}>
          {plans.map((plan) => {
            const isCurrent = isCurrentPlan(plan);
            const isPopular = plan.code === 'premium';
            const isProcessing = paymentState.isProcessing && selectedPlanId === plan.id;
            const price = billingCycle === 'yearly' ? plan.priceYearly : plan.priceMonthly;
            const gradient = PLAN_GRADIENTS[plan.code] || PLAN_GRADIENTS.free;
            const isUnlimited = plan.maxActiveListings >= 999;

            return (
              <View
                key={plan.id}
                style={[
                  styles.planCard,
                  {
                    backgroundColor: theme.colors.surface,
                    borderWidth: isPopular ? 2 : 1,
                    borderColor: isPopular
                      ? gradient[0]
                      : isCurrent
                      ? theme.colors.accent.main
                      : theme.colors.border,
                    ...theme.shadows.md,
                  },
                ]}
              >
                {/* Popular / Current Badge */}
                {(isPopular || isCurrent) && (
                  <View style={styles.cardBadgeContainer}>
                    <View
                      style={[
                        styles.cardBadge,
                        {
                          backgroundColor: isPopular
                            ? gradient[0]
                            : theme.colors.accent.main,
                        },
                      ]}
                    >
                      {isCurrent && <Check size={12} color="#fff" />}
                      <Text style={styles.cardBadgeText}>
                        {isCurrent ? 'PLAN CURENT' : 'CEL MAI POPULAR'}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Gradient Header with Name + Price */}
                <LinearGradient
                  colors={gradient as [string, string]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.cardGradientHeader}
                >
                  <View style={styles.cardHeaderLeft}>
                    {getPlanIcon(plan.code, 22, '#fff')}
                    <Text style={styles.cardPlanName}>{plan.name}</Text>
                  </View>
                  <View style={styles.cardHeaderRight}>
                    {price === 0 ? (
                      <Text style={styles.cardPriceFree}>Gratis</Text>
                    ) : (
                      <>
                        <Text style={styles.cardPrice}>
                          {formatPrice(price, plan.currency)}
                        </Text>
                        <Text style={styles.cardPricePeriod}>/lună</Text>
                      </>
                    )}
                  </View>
                </LinearGradient>

                {/* Key Limits Row */}
                <View style={styles.limitsRow}>
                  <View style={styles.limitItem}>
                    <Text style={[styles.limitValue, { color: gradient[0] }]}>
                      {isUnlimited ? '∞' : plan.maxActiveListings}
                    </Text>
                    <Text style={[styles.limitLabel, { color: theme.colors.textSecondary }]}>
                      {isUnlimited ? 'Nelimitat' : 'Anunțuri'}
                    </Text>
                  </View>
                  <View style={[styles.limitDivider, { backgroundColor: theme.colors.border }]} />
                  <View style={styles.limitItem}>
                    <Text style={[styles.limitValue, { color: gradient[0] }]}>
                      {plan.maxPhotosPerListing}
                    </Text>
                    <Text style={[styles.limitLabel, { color: theme.colors.textSecondary }]}>
                      Fotografii
                    </Text>
                  </View>
                  <View style={[styles.limitDivider, { backgroundColor: theme.colors.border }]} />
                  <View style={styles.limitItem}>
                    <Text style={[styles.limitValue, { color: gradient[0] }]}>
                      {plan.freeMonthlyBoosts || 0}
                    </Text>
                    <Text style={[styles.limitLabel, { color: theme.colors.textSecondary }]}>
                      Boost-uri
                    </Text>
                  </View>
                </View>

                {/* Compact Feature List */}
                <View style={styles.featuresList}>
                  <FeatureCheck
                    included={true}
                    text="Chat AI general"
                    theme={theme}
                  />
                  <FeatureCheck
                    included={plan.hasAdvancedStats || false}
                    text="Statistici avansate"
                    theme={theme}
                  />
                  <FeatureCheck
                    included={plan.hasAiFeatures || false}
                    text="AI generare descriere"
                    theme={theme}
                  />
                  <FeatureCheck
                    included={plan.code === 'premium'}
                    text="Asistent AI personalizat"
                    theme={theme}
                  />
                  <FeatureCheck
                    included={plan.code === 'standard' || plan.code === 'premium'}
                    text="Early access anunțuri noi"
                    theme={theme}
                  />
                  <FeatureCheck
                    included={plan.hasVideoTour || false}
                    text="Video tour"
                    theme={theme}
                  />
                  <FeatureCheck
                    included={plan.code === 'standard' || plan.code === 'premium'}
                    text="Prioritate căutări"
                    theme={theme}
                  />
                </View>

                {/* Yearly savings text */}
                {billingCycle === 'yearly' && price > 0 && (
                  <Text style={[styles.savingsText, { color: theme.colors.accent.main }]}>
                    Economisești {formatPrice(paymentService.calculateYearlySavings(plan), plan.currency)}/an
                  </Text>
                )}

                {/* CTA Button */}
                <TouchableOpacity
                  style={[
                    styles.ctaButton,
                    {
                      backgroundColor: isCurrent
                        ? theme.colors.border
                        : isPopular
                        ? gradient[0]
                        : theme.colors.primary.main + '12',
                    },
                  ]}
                  onPress={() => handleSubscribe(plan)}
                  disabled={isCurrent || isProcessing || paymentState.isProcessing}
                  activeOpacity={0.7}
                >
                  {isProcessing ? (
                    <ActivityIndicator size="small" color={isPopular ? '#fff' : theme.colors.primary.main} />
                  ) : (
                    <Text
                      style={[
                        styles.ctaButtonText,
                        {
                          color: isCurrent
                            ? theme.colors.textTertiary
                            : isPopular
                            ? '#fff'
                            : theme.colors.primary.main,
                        },
                      ]}
                    >
                      {getButtonText(plan)}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        {/* Collapsible FAQ Section */}
        <View style={[styles.faqSection, { marginHorizontal: 16, marginBottom: 32 }]}>
          <Text style={[styles.faqTitle, { color: theme.colors.textPrimary }]}>
            Întrebări Frecvente
          </Text>

          {FAQ_ITEMS.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.faqItem,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
              onPress={() => toggleFaq(index)}
              activeOpacity={0.7}
            >
              <View style={styles.faqHeader}>
                <Text style={[styles.faqQuestion, { color: theme.colors.textPrimary }]}>
                  {item.question}
                </Text>
                {expandedFaq === index ? (
                  <ChevronUp size={18} color={theme.colors.textTertiary} />
                ) : (
                  <ChevronDown size={18} color={theme.colors.textTertiary} />
                )}
              </View>
              {expandedFaq === index && (
                <Text style={[styles.faqAnswer, { color: theme.colors.textSecondary }]}>
                  {item.answer}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// ============================================================================
// FAQ DATA
// ============================================================================

const FAQ_ITEMS = [
  {
    question: 'Pot anula oricând?',
    answer: 'Da, poți anula subscripția oricând. Accesul la funcționalitățile premium continuă până la sfârșitul perioadei plătite.',
  },
  {
    question: 'Ce se întâmplă cu anunțurile la downgrade?',
    answer: 'Anunțurile existente rămân active, dar nu vei putea adăuga altele noi peste limita noului plan.',
  },
  {
    question: 'Cum funcționează perioada de probă?',
    answer: 'Perioada de probă de 14 zile este gratuită și nu necesită card. La final, poți alege să continui sau să revii la planul gratuit.',
  },
  {
    question: 'Ce metode de plată acceptați?',
    answer: 'Acceptăm Apple Pay, Google Pay, PAYNET, MAIB și MPAY. Plățile sunt procesate securizat.',
  },
];

// ============================================================================
// FEATURE CHECK COMPONENT
// ============================================================================

interface FeatureCheckProps {
  included: boolean;
  text: string;
  theme: any;
}

const FeatureCheck: React.FC<FeatureCheckProps> = ({ included, text, theme }) => (
  <View style={styles.featureRow}>
    {included ? (
      <Check size={15} color={theme.colors.accent.main} />
    ) : (
      <X size={15} color={theme.colors.textTertiary + '60'} />
    )}
    <Text
      style={[
        styles.featureText,
        {
          color: included ? theme.colors.textPrimary : theme.colors.textTertiary,
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

  // Header
  headerSection: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },
  currentPlanChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  currentPlanChipText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Billing Toggle
  billingToggleContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
  },
  billingPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  billingPillText: {
    fontSize: 14,
    fontWeight: '600',
  },
  discountChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  discountChipText: {
    fontSize: 10,
    fontWeight: '700',
  },

  // Plan Cards
  plansContainer: {
    paddingHorizontal: 16,
    gap: 16,
  },
  planCard: {
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  cardBadgeContainer: {
    position: 'absolute',
    top: -1,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  cardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  cardBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // Card Gradient Header
  cardGradientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingTop: 18,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardPlanName: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  cardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  cardPriceFree: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  cardPrice: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  cardPricePeriod: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    marginLeft: 2,
  },

  // Limits Row
  limitsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  limitItem: {
    alignItems: 'center',
    flex: 1,
  },
  limitValue: {
    fontSize: 22,
    fontWeight: '700',
  },
  limitLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  limitDivider: {
    width: 1,
    height: 30,
  },

  // Features List
  featuresList: {
    paddingHorizontal: 16,
    paddingBottom: 4,
    gap: 6,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 13,
    lineHeight: 18,
  },

  // Savings
  savingsText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    paddingTop: 6,
  },

  // CTA Button
  ctaButton: {
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 16,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },

  // FAQ
  faqSection: {
    marginTop: 24,
  },
  faqTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  faqItem: {
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 8,
    overflow: 'hidden',
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  faqQuestion: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    marginRight: 8,
  },
  faqAnswer: {
    fontSize: 13,
    lineHeight: 19,
    paddingHorizontal: 14,
    paddingBottom: 14,
    paddingTop: 0,
  },
});

export default PricingScreen;
