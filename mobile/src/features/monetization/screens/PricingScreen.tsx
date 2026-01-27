/**
 * IMOBI - Pricing Screen
 * Subscription plans and pricing options
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
  Check,
  X,
  Crown,
  Zap,
  Star,
  Sparkles,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';

import { useTheme } from '@/app/providers/ThemeProvider';
import { Button, ScreenHeader } from '@/shared/components';

interface PricingPlan {
  id: string;
  name: string;
  price: number;
  period: string;
  icon: React.ReactNode;
  badge?: string;
  gradient?: string[];
  features: {
    text: string;
    included: boolean;
  }[];
  popular?: boolean;
}

const PricingScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const plans: PricingPlan[] = [
    {
      id: 'free',
      name: 'Gratuit',
      price: 0,
      period: 'lună',
      icon: <Star size={32} color={theme.colors.textSecondary} />,
      features: [
        { text: '1 anunț activ', included: true },
        { text: '5 fotografii', included: true },
        { text: 'Statistici de bază', included: true },
        { text: 'Promovare anunțuri', included: false },
        { text: 'Suport prioritar', included: false },
        { text: 'Badge Premium', included: false },
      ],
    },
    {
      id: 'standard',
      name: 'Standard',
      price: billingCycle === 'monthly' ? 9.99 : 7.99,
      period: billingCycle === 'monthly' ? 'lună' : 'lună',
      icon: <Zap size={32} color={theme.colors.primary.main} />,
      gradient: [theme.colors.primary.main, theme.colors.primary.light],
      features: [
        { text: '5 anunțuri active', included: true },
        { text: '15 fotografii/anunț', included: true },
        { text: 'Statistici avansate', included: true },
        { text: 'Suport prioritar', included: true },
        { text: 'AI Analysis', included: true },
        { text: 'Badge Premium', included: false },
      ],
    },
    {
      id: 'premium',
      name: 'Premium',
      price: billingCycle === 'monthly' ? 19.99 : 15.99,
      period: billingCycle === 'monthly' ? 'lună' : 'lună',
      icon: <Crown size={32} color={theme.colors.secondary.warning} />,
      badge: 'CEL MAI POPULAR',
      gradient: [theme.colors.secondary.warning, '#d97706'],
      popular: true,
      features: [
        { text: '15 anunțuri active', included: true },
        { text: '30 fotografii/anunț', included: true },
        { text: 'Video tour', included: true },
        { text: 'Badge Premium', included: true },
        { text: 'Prioritate în căutări', included: true },
        { text: 'AI generare descrieri', included: true },
      ],
    },
  ];

  const handleSubscribe = (planId: string) => {
    console.log('Subscribe to:', planId, 'billing:', billingCycle);
    // Navigate to payment screen
  };

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
                <Text style={[styles.discountText, { color: theme.colors.accent.main }]}>-20%</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Pricing Cards */}
        <View style={styles.plansContainer}>
          {plans.map((plan) => (
            <View
              key={plan.id}
              style={[
                styles.planCard,
                {
                  backgroundColor: theme.colors.surface,
                  marginHorizontal: theme.spacing[4],
                  marginBottom: theme.spacing[4],
                  borderWidth: plan.popular ? 2 : 1,
                  borderColor: plan.popular
                    ? theme.colors.secondary.warning
                    : theme.colors.border,
                  ...theme.shadows.md,
                },
              ]}
            >
              {/* Popular Badge */}
              {plan.badge && (
                <View style={styles.popularBadgeContainer}>
                  <View
                    style={[
                      styles.popularBadge,
                      {
                        backgroundColor: theme.colors.secondary.warning,
                      },
                    ]}
                  >
                    <Text style={[styles.popularBadgeText, { color: theme.colors.surface }]}>{plan.badge}</Text>
                  </View>
                </View>
              )}

              {/* Plan Header */}
              <View style={styles.planHeader}>
                {plan.gradient ? (
                  <LinearGradient
                    colors={plan.gradient as [string, string, ...string[]]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.iconContainer}
                  >
                    <View style={styles.iconWrapper}>{plan.icon}</View>
                  </LinearGradient>
                ) : (
                  <View
                    style={[
                      styles.iconContainer,
                      {
                        backgroundColor: theme.colors.textTertiary + '20',
                      },
                    ]}
                  >
                    {plan.icon}
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
                      color: plan.gradient
                        ? plan.gradient[0]
                        : theme.colors.textSecondary,
                      fontSize: theme.typography.fontSize['4xl'],
                    },
                  ]}
                >
                  {plan.price}€
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
                  /{plan.period}
                </Text>
              </View>

              {billingCycle === 'yearly' && plan.price > 0 && (
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
                  Economisești {((plan.price / 0.8 - plan.price) * 12).toFixed(0)}€/an
                </Text>
              )}

              {/* Features */}
              <View style={[styles.featuresContainer, { marginTop: theme.spacing[5] }]}>
                {plan.features.map((feature, index) => (
                  <View key={index} style={styles.featureRow}>
                    {feature.included ? (
                      <Check size={18} color={theme.colors.accent.main} />
                    ) : (
                      <X size={18} color={theme.colors.textTertiary} />
                    )}
                    <Text
                      style={[
                        styles.featureText,
                        {
                          color: feature.included
                            ? theme.colors.textPrimary
                            : theme.colors.textTertiary,
                          fontSize: theme.typography.fontSize.sm,
                        },
                      ]}
                    >
                      {feature.text}
                    </Text>
                  </View>
                ))}
              </View>

              {/* CTA Button */}
              <Button
                title={
                  plan.id === 'free'
                    ? 'Plan Curent'
                    : plan.id === 'standard'
                    ? 'Încearcă 14 zile gratis'
                    : 'Upgrade Acum'
                }
                onPress={() => handleSubscribe(plan.id)}
                variant={plan.popular ? 'primary' : 'secondary'}
                fullWidth
                style={{ marginTop: theme.spacing[5] }}
                disabled={plan.id === 'free'}
              />
            </View>
          ))}
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
  billingToggle: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
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
    // color applied dynamically
    fontSize: 11,
    fontWeight: '700',
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
    // color applied dynamically
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
