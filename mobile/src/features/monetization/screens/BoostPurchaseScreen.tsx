/**
 * 🚀 BOOST PURCHASE SCREEN
 *
 * Ecran pentru achiziționarea promoțiilor pentru listări.
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
  Rocket,
  Star,
  TrendingUp,
  Eye,
  Zap,
  CheckCircle,
  Gift,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';

import { useTheme } from '@/app/providers/ThemeProvider';
import { Button, ScreenHeader } from '@/shared/components';
import {
  usePayments,
  usePromotionPlans,
  useMonetizationStatus,
  useListingPromotion,
} from '../hooks/usePayments';
import { PromotionPlan } from '../types';
import * as paymentService from '../services/paymentService';

// ============================================================================
// TYPES
// ============================================================================

type BoostPurchaseRouteParams = {
  BoostPurchase: {
    listingId?: number | string;
    propertyId?: string;
    listingTitle?: string;
    listingLocation?: string;
    listingPrice?: string;
  };
};

// ============================================================================
// COMPONENT
// ============================================================================

const BoostPurchaseScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<BoostPurchaseRouteParams, 'BoostPurchase'>>();

  // Get listing info from route params
  const rawListingId = route.params?.listingId ?? route.params?.propertyId;
  const parsedListingId =
    typeof rawListingId === 'number' ? rawListingId : Number(rawListingId ?? 0);
  const listingId = Number.isFinite(parsedListingId) && parsedListingId > 0
    ? parsedListingId
    : null;
  const listingTitle = route.params?.listingTitle || 'Anunț';
  const listingLocation = route.params?.listingLocation || '';
  const listingPrice = route.params?.listingPrice || '';

  // State
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [useFreeBoost, setUseFreeBoost] = useState(false);

  // Hooks
  const { plans, isLoading: plansLoading, error: plansError } = usePromotionPlans();
  const { freeBoostsRemaining, refetch: refetchStatus } = useMonetizationStatus();
  const { hasActivePromotion, promotion, isLoading: promotionLoading } = useListingPromotion(listingId);
  const {
    state: paymentState,
    platformConfig,
    purchasePromotion,
    formatPrice,
    resetState,
  } = usePayments();

  // Get icon component for plan
  const getPlanIcon = (code: string) => {
    switch (code) {
      case 'boost_24h':
        return Zap;
      case 'boost_7d':
        return Rocket;
      case 'boost_14d':
        return Rocket;
      case 'highlight':
        return Star;
      case 'homepage':
        return Eye;
      default:
        return Zap;
    }
  };

  // Get gradient for plan
  const getPlanGradient = (code: string): string[] => {
    switch (code) {
      case 'boost_24h':
        return [theme.colors.secondary.info, '#60a5fa'];
      case 'boost_7d':
        return [theme.colors.primary.main, theme.colors.primary.light];
      case 'boost_14d':
        return ['#7c3aed', '#a855f7'];
      case 'highlight':
        return [theme.colors.secondary.warning, '#d97706'];
      case 'homepage':
        return [theme.colors.accent.main, '#34d399'];
      default:
        return [theme.colors.primary.main, theme.colors.primary.light];
    }
  };

  // Get selected plan
  const selectedPlan = plans.find((p) => p.id === selectedPlanId);

  // Calculate total price
  const getTotalPrice = (): number => {
    if (!selectedPlan) return 0;
    if (useFreeBoost && freeBoostsRemaining > 0 && selectedPlan.code.includes('boost')) return 0;
    return selectedPlan.price;
  };

  // Check if can use free boost
  const canUseFreeBoost = (plan: PromotionPlan): boolean => {
    return freeBoostsRemaining > 0 && plan.code.includes('boost');
  };

  // Handle purchase
  const handlePurchase = async () => {
    if (!selectedPlan || !listingId) return;

    const isFree = useFreeBoost && canUseFreeBoost(selectedPlan);
    const priceText = isFree ? 'GRATUIT' : formatPrice(selectedPlan.price, selectedPlan.currency);

    Alert.alert(
      `Promovează Anunțul`,
      `Dorești să activezi "${selectedPlan.name}" pentru ${priceText}?\n\n` +
        `Durata: ${selectedPlan.durationDays} zile\n` +
        (isFree
          ? `(Folosești 1 din ${freeBoostsRemaining} boost-uri gratuite)`
          : `Plata se va face prin ${paymentService.getProviderInfo(platformConfig.preferredProvider).name}.`),
      [
        { text: 'Anulează', style: 'cancel' },
        {
          text: isFree ? 'Activează Gratuit' : 'Continuă',
          onPress: async () => {
            const success = await purchasePromotion(selectedPlan, listingId, isFree);

            if (success) {
              if (!paymentState.requiresPolling || isFree) {
                Alert.alert(
                  'Succes! 🚀',
                  `Promoția "${selectedPlan.name}" a fost activată pentru anunțul tău!`,
                  [
                    {
                      text: 'OK',
                      onPress: () => {
                        refetchStatus();
                        resetState();
                        navigation.goBack();
                      },
                    },
                  ],
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
          },
        },
      ],
    );
  };

  if (!listingId) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        edges={['top']}
      >
        <ScreenHeader title="Promovează Anunțul" />
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}> 
            Nu am putut identifica anunțul pentru promovare.
          </Text>
          <Button
            title="Înapoi"
            onPress={() => navigation.goBack()}
            variant="outline"
            style={{ marginTop: theme.spacing[4] }}
          />
        </View>
      </SafeAreaView>
    );
  }

  // Loading state
  if (plansLoading || promotionLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        edges={['top']}
      >
        <ScreenHeader title="Promovează Anunțul" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary.main} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            Se încarcă opțiunile...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Already has active promotion
  if (hasActivePromotion && promotion) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        edges={['top']}
      >
        <ScreenHeader title="Promovează Anunțul" />
        <View style={styles.alreadyPromotedContainer}>
          <View
            style={[
              styles.alreadyPromotedCard,
              {
                backgroundColor: theme.colors.surface,
                padding: theme.spacing[6],
                borderRadius: theme.borderRadius.xl,
                ...theme.shadows.md,
              },
            ]}
          >
            <CheckCircle size={64} color={theme.colors.accent.main} />
            <Text
              style={[
                styles.alreadyPromotedTitle,
                {
                  color: theme.colors.textPrimary,
                  fontSize: theme.typography.fontSize['2xl'],
                  marginTop: theme.spacing[4],
                },
              ]}
            >
              Anunț deja promovat!
            </Text>
            <Text
              style={[
                styles.alreadyPromotedText,
                {
                  color: theme.colors.textSecondary,
                  fontSize: theme.typography.fontSize.base,
                  marginTop: theme.spacing[2],
                },
              ]}
            >
              Promoția "{promotion.promotionPlan?.name}" este activă încă {promotion.remainingDays} zile.
            </Text>
            <Button
              title="Înapoi"
              onPress={() => navigation.goBack()}
              variant="primary"
              style={{ marginTop: theme.spacing[6] }}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      <ScreenHeader title="Promovează Anunțul" />

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
          <View style={styles.propertyHeader}>
            <View style={styles.propertyInfo}>
              <Text
                style={[
                  styles.propertyTitle,
                  {
                    color: theme.colors.textPrimary,
                    fontSize: theme.typography.fontSize.lg,
                  },
                ]}
              >
                {listingTitle}
              </Text>
              {listingLocation && (
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
                  {listingLocation}
                </Text>
              )}
            </View>
          </View>
          {listingPrice && (
            <View
              style={[
                styles.priceTag,
                {
                  backgroundColor: theme.colors.accent.main + '15',
                  marginTop: theme.spacing[3],
                  paddingVertical: theme.spacing[2],
                  paddingHorizontal: theme.spacing[3],
                  borderRadius: theme.borderRadius.lg,
                },
              ]}
            >
              <Text
                style={[
                  styles.priceText,
                  {
                    color: theme.colors.accent.main,
                    fontSize: theme.typography.fontSize.xl,
                    fontWeight: '700',
                  },
                ]}
              >
                {listingPrice}
              </Text>
            </View>
          )}
        </View>

        {/* Free Boosts Banner */}
        {freeBoostsRemaining > 0 && (
          <View
            style={[
              styles.freeBoostBanner,
              {
                backgroundColor: theme.colors.accent.main + '15',
                marginHorizontal: theme.spacing[4],
                marginTop: theme.spacing[4],
                padding: theme.spacing[4],
                borderRadius: theme.borderRadius.xl,
                borderWidth: 1,
                borderColor: theme.colors.accent.main + '30',
              },
            ]}
          >
            <View style={styles.freeBoostContent}>
              <Gift size={24} color={theme.colors.accent.main} />
              <View style={styles.freeBoostText}>
                <Text
                  style={[
                    styles.freeBoostTitle,
                    { color: theme.colors.textPrimary, fontSize: theme.typography.fontSize.base },
                  ]}
                >
                  {freeBoostsRemaining} boost-uri gratuite disponibile!
                </Text>
                <Text
                  style={[
                    styles.freeBoostSubtitle,
                    { color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.sm },
                  ]}
                >
                  Incluse în abonamentul tău
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Section Title */}
        <Text
          style={[
            styles.sectionTitle,
            {
              color: theme.colors.textPrimary,
              fontSize: theme.typography.fontSize.lg,
              marginHorizontal: theme.spacing[4],
              marginTop: theme.spacing[6],
              marginBottom: theme.spacing[3],
            },
          ]}
        >
          Alege opțiunea de promovare
        </Text>

        {/* Boost Options */}
        <View style={styles.boostOptionsContainer}>
          {plans.map((plan) => {
            const Icon = getPlanIcon(plan.code);
            const gradient = getPlanGradient(plan.code);
            const isSelected = selectedPlanId === plan.id;
            const hasFreeOption = canUseFreeBoost(plan);
            const isPopular = plan.code === 'boost_7d';

            return (
              <TouchableOpacity
                key={plan.id}
                style={[
                  styles.boostCard,
                  {
                    backgroundColor: theme.colors.surface,
                    marginHorizontal: theme.spacing[4],
                    marginBottom: theme.spacing[3],
                    borderWidth: 2,
                    borderColor: isSelected ? gradient[0] : theme.colors.border,
                    borderRadius: theme.borderRadius.xl,
                    ...theme.shadows.md,
                  },
                ]}
                onPress={() => {
                  setSelectedPlanId(plan.id);
                  // Auto-enable free boost if available
                  if (hasFreeOption && freeBoostsRemaining > 0) {
                    setUseFreeBoost(true);
                  } else {
                    setUseFreeBoost(false);
                  }
                }}
              >
                {/* Popular Badge */}
                {isPopular && (
                  <View
                    style={[
                      styles.popularBadge,
                      { backgroundColor: theme.colors.accent.main },
                    ]}
                  >
                    <Text style={[styles.popularText, { color: theme.colors.surface }]}>
                      RECOMANDAT
                    </Text>
                  </View>
                )}

                <View style={styles.boostCardContent}>
                  {/* Icon */}
                  <LinearGradient
                    colors={gradient as [string, string, ...string[]]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.boostIcon}
                  >
                    <Icon size={28} color={theme.colors.surface} />
                  </LinearGradient>

                  {/* Info */}
                  <View style={styles.boostInfo}>
                    <View style={styles.boostTitleRow}>
                      <Text
                        style={[
                          styles.boostTitle,
                          {
                            color: theme.colors.textPrimary,
                            fontSize: theme.typography.fontSize.base,
                          },
                        ]}
                      >
                        {plan.name}
                      </Text>
                      {isSelected && (
                        <CheckCircle size={20} color={theme.colors.accent.main} />
                      )}
                    </View>
                    <Text
                      style={[
                        styles.boostSubtitle,
                        {
                          color: theme.colors.textSecondary,
                          fontSize: theme.typography.fontSize.sm,
                        },
                      ]}
                    >
                      {plan.description} • {plan.durationDays} zile
                    </Text>
                  </View>

                  {/* Price */}
                  <View style={styles.priceColumn}>
                    {hasFreeOption && freeBoostsRemaining > 0 ? (
                      <>
                        <Text
                          style={[
                            styles.freePrice,
                            {
                              color: theme.colors.accent.main,
                              fontSize: theme.typography.fontSize.lg,
                            },
                          ]}
                        >
                          GRATUIT
                        </Text>
                        <Text
                          style={[
                            styles.originalPrice,
                            {
                              color: theme.colors.textTertiary,
                              fontSize: theme.typography.fontSize.sm,
                              textDecorationLine: 'line-through',
                            },
                          ]}
                        >
                          {formatPrice(plan.price, plan.currency)}
                        </Text>
                      </>
                    ) : (
                      <Text
                        style={[
                          styles.boostPrice,
                          {
                            color: gradient[0],
                            fontSize: theme.typography.fontSize.xl,
                          },
                        ]}
                      >
                        {formatPrice(plan.price, plan.currency)}
                      </Text>
                    )}
                  </View>
                </View>

                {/* Benefits (shown when selected) */}
                {isSelected && (
                  <View
                    style={[
                      styles.benefitsContainer,
                      {
                        marginTop: theme.spacing[3],
                        paddingTop: theme.spacing[3],
                        borderTopWidth: 1,
                        borderTopColor: theme.colors.border,
                      },
                    ]}
                  >
                    {plan.showBadge && (
                      <View style={styles.benefitRow}>
                        <TrendingUp size={16} color={theme.colors.accent.main} />
                        <Text
                          style={[
                            styles.benefitText,
                            {
                              color: theme.colors.textSecondary,
                              fontSize: theme.typography.fontSize.sm,
                            },
                          ]}
                        >
                          Badge "Promovat" pe anunț
                        </Text>
                      </View>
                    )}
                    {plan.searchBoostMultiplier > 1 && (
                      <View style={styles.benefitRow}>
                        <TrendingUp size={16} color={theme.colors.accent.main} />
                        <Text
                          style={[
                            styles.benefitText,
                            {
                              color: theme.colors.textSecondary,
                              fontSize: theme.typography.fontSize.sm,
                            },
                          ]}
                        >
                          +{((plan.searchBoostMultiplier - 1) * 100).toFixed(0)}% prioritate în căutări
                        </Text>
                      </View>
                    )}
                    {plan.showOnHomepage && (
                      <View style={styles.benefitRow}>
                        <Eye size={16} color={theme.colors.accent.main} />
                        <Text
                          style={[
                            styles.benefitText,
                            {
                              color: theme.colors.textSecondary,
                              fontSize: theme.typography.fontSize.sm,
                            },
                          ]}
                        >
                          Afișat pe pagina principală
                        </Text>
                      </View>
                    )}

                    {/* Free boost toggle */}
                    {hasFreeOption && freeBoostsRemaining > 0 && (
                      <TouchableOpacity
                        style={[
                          styles.freeBoostToggle,
                          {
                            backgroundColor: useFreeBoost
                              ? theme.colors.accent.main + '20'
                              : theme.colors.background,
                            marginTop: theme.spacing[2],
                            padding: theme.spacing[2],
                            borderRadius: theme.borderRadius.md,
                            borderWidth: 1,
                            borderColor: useFreeBoost
                              ? theme.colors.accent.main
                              : theme.colors.border,
                          },
                        ]}
                        onPress={() => setUseFreeBoost(!useFreeBoost)}
                      >
                        <Gift size={16} color={theme.colors.accent.main} />
                        <Text
                          style={[
                            styles.freeBoostToggleText,
                            {
                              color: theme.colors.textPrimary,
                              fontSize: theme.typography.fontSize.sm,
                            },
                          ]}
                        >
                          {useFreeBoost ? 'Folosești boost gratuit ✓' : 'Folosește boost gratuit'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Info Section */}
        <View
          style={[
            styles.infoSection,
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
              styles.infoTitle,
              {
                color: theme.colors.textPrimary,
                fontSize: theme.typography.fontSize.base,
              },
            ]}
          >
            Cum funcționează?
          </Text>
          <Text
            style={[
              styles.infoText,
              {
                color: theme.colors.textSecondary,
                fontSize: theme.typography.fontSize.sm,
                marginTop: theme.spacing[2],
                lineHeight: 20,
              },
            ]}
          >
            Anunțul tău va apărea în topul rezultatelor căutării pentru zona selectată.
            Promovarea începe imediat după plată și durează pentru perioada aleasă.
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Bar */}
      {selectedPlanId && (
        <View
          style={[
            styles.bottomBar,
            {
              backgroundColor: theme.colors.surface,
              borderTopColor: theme.colors.border,
              paddingBottom: theme.spacing[4],
            },
          ]}
        >
          <View style={styles.totalContainer}>
            <Text
              style={[
                styles.totalLabel,
                {
                  color: theme.colors.textSecondary,
                  fontSize: theme.typography.fontSize.sm,
                },
              ]}
            >
              Total selectat:
            </Text>
            <Text
              style={[
                styles.totalPrice,
                {
                  color: getTotalPrice() === 0 ? theme.colors.accent.main : theme.colors.textPrimary,
                  fontSize: theme.typography.fontSize['2xl'],
                },
              ]}
            >
              {getTotalPrice() === 0 ? 'GRATUIT' : formatPrice(getTotalPrice(), selectedPlan?.currency || 'MDL')}
            </Text>
          </View>
          <Button
            title={
              paymentState.isProcessing
                ? 'Se procesează...'
                : getTotalPrice() === 0
                ? 'Activează Gratuit'
                : paymentService.getPayButtonText(platformConfig.preferredProvider)
            }
            onPress={handlePurchase}
            variant="primary"
            fullWidth
            disabled={paymentState.isProcessing}
          />
        </View>
      )}
    </SafeAreaView>
  );
};

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
  alreadyPromotedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  alreadyPromotedCard: {
    alignItems: 'center',
    maxWidth: 320,
  },
  alreadyPromotedTitle: {
    fontWeight: '700',
    textAlign: 'center',
  },
  alreadyPromotedText: {
    textAlign: 'center',
  },
  propertyCard: {},
  propertyHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  propertyInfo: {
    flex: 1,
  },
  propertyTitle: {
    fontWeight: '600',
  },
  propertyLocation: {},
  priceTag: {
    alignSelf: 'flex-start',
  },
  priceText: {},
  freeBoostBanner: {},
  freeBoostContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  freeBoostText: {
    flex: 1,
  },
  freeBoostTitle: {
    fontWeight: '600',
  },
  freeBoostSubtitle: {},
  sectionTitle: {
    fontWeight: '600',
  },
  boostOptionsContainer: {
    marginTop: 8,
  },
  boostCard: {
    padding: 20,
    position: 'relative',
  },
  popularBadge: {
    position: 'absolute',
    top: -1,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  popularText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  boostCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  boostIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  boostInfo: {
    flex: 1,
  },
  boostTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  boostTitle: {
    fontWeight: '600',
  },
  boostSubtitle: {},
  priceColumn: {
    alignItems: 'flex-end',
  },
  boostPrice: {
    fontWeight: '700',
  },
  freePrice: {
    fontWeight: '700',
  },
  originalPrice: {},
  benefitsContainer: {},
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  benefitText: {
    flex: 1,
  },
  freeBoostToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  freeBoostToggleText: {
    fontWeight: '500',
  },
  infoSection: {},
  infoTitle: {
    fontWeight: '600',
  },
  infoText: {},
  bottomBar: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  totalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  totalLabel: {},
  totalPrice: {
    fontWeight: '700',
  },
});

export default BoostPurchaseScreen;
