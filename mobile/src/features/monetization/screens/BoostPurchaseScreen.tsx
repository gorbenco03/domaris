/**
 * RIVA - Boost Purchase Screen
 * Screen for purchasing property boost/promotion options
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
  Rocket,
  Star,
  TrendingUp,
  Eye,
  Zap,
  CheckCircle,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';

import { useTheme } from '@/app/providers/ThemeProvider';
import { Button, ScreenHeader } from '@/shared/components';

interface BoostOption {
  id: string;
  title: string;
  subtitle: string;
  price: number;
  duration: string;
  icon: any;
  gradient: string[];
  benefits: string[];
  impact: string;
  popular?: boolean;
}

const BoostPurchaseScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const [selectedBoost, setSelectedBoost] = useState<string | null>(null);

  // Mock property data
  const property = {
    title: 'Apartament 3 camere',
    location: 'Drumul Taberei, București',
    price: '95,000€',
  };

  const boostOptions: BoostOption[] = [
    {
      id: 'boost_24h',
      title: 'Boost 24h',
      subtitle: 'Promovare rapidă',
      price: 1.99,
      duration: '24 ore',
      icon: Zap,
      gradient: [theme.colors.secondary.info, '#60a5fa'],
      benefits: [
        'Top lista în zonă',
        'Vizibilitate maximă',
        'Potrivit pentru teste',
      ],
      impact: '+150% views estimate',
    },
    {
      id: 'boost_7d',
      title: 'Boost 7 zile',
      subtitle: 'Promovare optimă',
      price: 9.99,
      duration: '7 zile',
      icon: Rocket,
      gradient: [theme.colors.primary.main, theme.colors.primary.light],
      benefits: [
        'Top lista 7 zile',
        '+50% mai multe views',
        'Notificări speciale',
      ],
      impact: '+300% views estimate',
      popular: true,
    },
    {
      id: 'highlight',
      title: 'Highlight',
      subtitle: 'Badge special',
      price: 4.99,
      duration: '14 zile',
      icon: Star,
      gradient: [theme.colors.secondary.warning, '#d97706'],
      benefits: [
        'Badge "Promovat"',
        'Evidențiere în listă',
        'Atenție crescută',
      ],
      impact: '+200% engagement',
    },
  ];

  const selectedOption = boostOptions.find((opt) => opt.id === selectedBoost);
  const totalPrice = selectedOption ? selectedOption.price : 0;

  const handlePurchase = () => {
    if (!selectedBoost) return;
    console.log('Purchase boost:', selectedBoost);
    // Navigate to payment
  };

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
                {property.title}
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
                {property.location}
              </Text>
            </View>
          </View>
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
              {property.price}
            </Text>
          </View>
        </View>

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
          {boostOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = selectedBoost === option.id;

            return (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.boostCard,
                  {
                    backgroundColor: theme.colors.surface,
                    marginHorizontal: theme.spacing[4],
                    marginBottom: theme.spacing[3],
                    borderWidth: 2,
                    borderColor: isSelected
                      ? option.gradient[0]
                      : theme.colors.border,
                    borderRadius: theme.borderRadius.xl,
                    ...theme.shadows.md,
                  },
                ]}
                onPress={() => setSelectedBoost(option.id)}
              >
                {/* Popular Badge */}
                {option.popular && (
                  <View
                    style={[
                      styles.popularBadge,
                      {
                        backgroundColor: theme.colors.accent.main,
                      },
                    ]}
                  >
                    <Text style={[styles.popularText, { color: theme.colors.surface }]}>RECOMANDAT</Text>
                  </View>
                )}

                <View style={styles.boostCardContent}>
                  {/* Icon */}
                  <LinearGradient
                    colors={option.gradient as [string, string, ...string[]]}
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
                        {option.title}
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
                      {option.subtitle} • {option.duration}
                    </Text>
                  </View>

                  {/* Price */}
                  <Text
                    style={[
                      styles.boostPrice,
                      {
                        color: option.gradient[0],
                        fontSize: theme.typography.fontSize.xl,
                      },
                    ]}
                  >
                    {option.price}€
                  </Text>
                </View>

                {/* Benefits */}
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
                    {option.benefits.map((benefit, index) => (
                      <View key={index} style={styles.benefitRow}>
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
                          {benefit}
                        </Text>
                      </View>
                    ))}
                    <View
                      style={[
                        styles.impactBadge,
                        {
                          backgroundColor: theme.colors.accent.main + '15',
                          marginTop: theme.spacing[2],
                          padding: theme.spacing[2],
                          borderRadius: theme.borderRadius.md,
                        },
                      ]}
                    >
                      <Eye size={14} color={theme.colors.accent.main} />
                      <Text
                        style={[
                          styles.impactText,
                          {
                            color: theme.colors.accent.main,
                            fontSize: theme.typography.fontSize.xs,
                          },
                        ]}
                      >
                        {option.impact}
                      </Text>
                    </View>
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
      {selectedBoost && (
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
                  color: theme.colors.textPrimary,
                  fontSize: theme.typography.fontSize['2xl'],
                },
              ]}
            >
              {totalPrice.toFixed(2)}€
            </Text>
          </View>
          <Button
            title="Plătește cu Apple Pay"
            onPress={handlePurchase}
            variant="primary"
            fullWidth
          />
        </View>
      )}
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
    // color applied dynamically
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
  boostPrice: {
    fontWeight: '700',
  },
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
  impactBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
  },
  impactText: {
    fontWeight: '600',
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
