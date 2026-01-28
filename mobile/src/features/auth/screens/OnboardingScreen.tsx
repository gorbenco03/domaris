/**
 * RIVA - Onboarding Screen
 * First-time user onboarding with 3 slides
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  Animated,
  ViewToken,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Home,
  Search,
  MessageCircle,
  Sparkles,
  Shield,
  ChevronRight,
} from 'lucide-react-native';
import { useTheme } from '@/app/providers/ThemeProvider';
import { AuthStackParamList } from '@/app/navigation/types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type NavigationProp = NativeStackNavigationProp<AuthStackParamList>;

interface OnboardingSlide {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: [string, string];
}

const ONBOARDING_KEY = '@riva_onboarding_complete';

const OnboardingScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isChecking, setIsChecking] = useState(true);

  // These refs must be defined before any early returns to maintain hooks order
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setCurrentIndex(viewableItems[0].index);
      }
    }
  ).current;

  const viewabilityConfig = useRef({
    viewAreaCoveragePercentThreshold: 50,
  }).current;

  // Check if user has already seen onboarding
  React.useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        const hasSeenOnboarding = await AsyncStorage.getItem(ONBOARDING_KEY);
        if (hasSeenOnboarding === 'true') {
          navigation.replace('Welcome');
        } else {
          setIsChecking(false);
        }
      } catch (error) {
        setIsChecking(false);
      }
    };
    checkOnboardingStatus();
  }, [navigation]);

  // Show nothing while checking
  if (isChecking) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: theme.colors.primary.main }} />
      </View>
    );
  }

  const slides: OnboardingSlide[] = [
    {
      id: '1',
      icon: <Home size={80} color="#ffffff" strokeWidth={1.5} />,
      title: 'Găsește casa visurilor',
      description:
        'Descoperă mii de proprietăți direct de la proprietari, fără comisioane de agenție.',
      gradient: [theme.colors.primary.main, theme.colors.primary.dark],
    },
    {
      id: '2',
      icon: <Sparkles size={80} color="#ffffff" strokeWidth={1.5} />,
      title: 'Asistent AI Inteligent',
      description:
        'Spune-ne ce cauți în limbaj natural și AI-ul nostru îți va găsi proprietățile perfecte.',
      gradient: ['#6366f1', '#4f46e5'],
    },
    {
      id: '3',
      icon: <Shield size={80} color="#ffffff" strokeWidth={1.5} />,
      title: 'Tranzacții Sigure',
      description:
        'Proprietari verificați, mesagerie directă și programare vizionări - totul într-un singur loc.',
      gradient: [theme.colors.accent.main, theme.colors.accent.dark || '#059669'],
    },
  ];

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      completeOnboarding();
    }
  };

  const handleSkip = () => {
    completeOnboarding();
  };

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    } catch (error) {
      console.error('Error saving onboarding status:', error);
    }
    navigation.replace('Welcome');
  };

  const renderSlide = ({ item }: { item: OnboardingSlide }) => (
    <View style={styles.slide}>
      <LinearGradient
        colors={item.gradient}
        style={styles.slideGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Decorative elements */}
        <View style={styles.decorCircle1} />
        <View style={styles.decorCircle2} />
        <View style={styles.decorCircle3} />

        <View style={styles.iconContainer}>{item.icon}</View>

        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description}>{item.description}</Text>
      </LinearGradient>
    </View>
  );

  const renderDots = () => (
    <View style={styles.dotsContainer}>
      {slides.map((_, index) => {
        const inputRange = [
          (index - 1) * SCREEN_WIDTH,
          index * SCREEN_WIDTH,
          (index + 1) * SCREEN_WIDTH,
        ];

        const dotWidth = scrollX.interpolate({
          inputRange,
          outputRange: [8, 24, 8],
          extrapolate: 'clamp',
        });

        const opacity = scrollX.interpolate({
          inputRange,
          outputRange: [0.4, 1, 0.4],
          extrapolate: 'clamp',
        });

        return (
          <Animated.View
            key={index}
            style={[
              styles.dot,
              {
                width: dotWidth,
                opacity,
                backgroundColor: '#ffffff',
              },
            ]}
          />
        );
      })}
    </View>
  );

  const isLastSlide = currentIndex === slides.length - 1;

  return (
    <View style={styles.container}>
      <Animated.FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        scrollEventThrottle={16}
      />

      <SafeAreaView style={styles.footer} edges={['bottom']}>
        {renderDots()}

        <View style={styles.buttonsContainer}>
          {!isLastSlide && (
            <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
              <Text style={[styles.skipText, { color: theme.colors.textSecondary }]}>
                Sari peste
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={handleNext}
            style={[
              styles.nextButton,
              { backgroundColor: theme.colors.primary.main },
              isLastSlide && styles.getStartedButton,
            ]}
            activeOpacity={0.8}
          >
            <Text style={styles.nextText}>
              {isLastSlide ? 'Începe' : 'Continuă'}
            </Text>
            <ChevronRight size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
  },
  slideGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 180,
    overflow: 'hidden',
  },
  decorCircle1: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  decorCircle2: {
    position: 'absolute',
    bottom: 100,
    left: -80,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  decorCircle3: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.3,
    right: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 17,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 26,
    maxWidth: 300,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skipButton: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '500',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: 14,
    gap: 6,
  },
  getStartedButton: {
    flex: 1,
    marginLeft: 16,
  },
  nextText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default OnboardingScreen;
