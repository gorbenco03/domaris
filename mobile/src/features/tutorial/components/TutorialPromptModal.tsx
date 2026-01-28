/**
 * RIVA - Tutorial Prompt Modal
 * "Do you want a quick tour?" modal shown after first login
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles, ArrowRight } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/app/providers/ThemeProvider';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 48;

interface TutorialPromptModalProps {
  visible: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export const TutorialPromptModal: React.FC<TutorialPromptModalProps> = ({
  visible,
  onAccept,
  onDecline,
}) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  // Animation values
  const backdropOpacity = useSharedValue(0);
  const cardScale = useSharedValue(0.9);
  const cardOpacity = useSharedValue(0);
  const cardTranslateY = useSharedValue(30);

  useEffect(() => {
    if (visible) {
      backdropOpacity.value = withTiming(1, { duration: 300 });
      cardOpacity.value = withTiming(1, { duration: 300 });
      cardScale.value = withSpring(1, { damping: 15, stiffness: 150 });
      cardTranslateY.value = withSpring(0, { damping: 15, stiffness: 150 });
    } else {
      backdropOpacity.value = withTiming(0, { duration: 200 });
      cardOpacity.value = withTiming(0, { duration: 200 });
      cardScale.value = withTiming(0.9, { duration: 200 });
      cardTranslateY.value = withTiming(30, { duration: 200 });
    }
  }, [visible]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [
      { scale: cardScale.value },
      { translateY: cardTranslateY.value },
    ],
  }));

  const styles = createStyles(theme);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <View style={styles.container}>
        {/* Backdrop */}
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={onDecline}
          />
        </Animated.View>

        {/* Card */}
        <Animated.View style={[styles.card, cardStyle]}>
          {/* Icon with gradient background */}
          <LinearGradient
            colors={[theme.colors.secondary.main, '#8b5cf6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconContainer}
          >
            <Sparkles size={32} color="#ffffff" />
          </LinearGradient>

          {/* Content */}
          <Text style={styles.title}>Bun venit la RIVA!</Text>
          <Text style={styles.subtitle}>
            Vrei să vezi un ghid rapid de utilizare?
          </Text>
          <Text style={styles.description}>
            Îți vom arăta cele mai importante funcționalități în doar câteva secunde.
          </Text>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.declineButton}
              onPress={onDecline}
              activeOpacity={0.7}
            >
              <Text style={styles.declineButtonText}>Mai târziu</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.acceptButton}
              onPress={onAccept}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[theme.colors.primary.main, theme.colors.primary.light]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.acceptButtonGradient}
              >
                <Text style={styles.acceptButtonText}>Da, arată-mi</Text>
                <ArrowRight size={18} color="#ffffff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
    },
    card: {
      width: CARD_WIDTH,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius['2xl'],
      padding: theme.spacing[6],
      alignItems: 'center',
      ...Platform.select({
        ios: theme.shadows.xl,
        android: { elevation: 12 },
      }),
    },
    iconContainer: {
      width: 72,
      height: 72,
      borderRadius: 36,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: theme.spacing[4],
    },
    title: {
      fontSize: theme.typography.fontSize['2xl'],
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.textPrimary,
      textAlign: 'center',
      marginBottom: theme.spacing[2],
    },
    subtitle: {
      fontSize: theme.typography.fontSize.lg,
      fontWeight: theme.typography.fontWeight.medium,
      color: theme.colors.textPrimary,
      textAlign: 'center',
      marginBottom: theme.spacing[2],
    },
    description: {
      fontSize: theme.typography.fontSize.base,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: theme.typography.fontSize.base * theme.typography.lineHeight.normal,
      marginBottom: theme.spacing[6],
    },
    actions: {
      flexDirection: 'row',
      gap: theme.spacing[3],
      width: '100%',
    },
    declineButton: {
      flex: 1,
      paddingVertical: theme.spacing[4],
      borderRadius: theme.borderRadius.lg,
      backgroundColor: theme.colors.divider,
      alignItems: 'center',
      justifyContent: 'center',
    },
    declineButtonText: {
      fontSize: theme.typography.fontSize.base,
      fontWeight: theme.typography.fontWeight.semibold,
      color: theme.colors.textSecondary,
    },
    acceptButton: {
      flex: 1.5,
      borderRadius: theme.borderRadius.lg,
      overflow: 'hidden',
    },
    acceptButtonGradient: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: theme.spacing[4],
      gap: theme.spacing[2],
    },
    acceptButtonText: {
      fontSize: theme.typography.fontSize.base,
      fontWeight: theme.typography.fontWeight.semibold,
      color: '#ffffff',
    },
  });

export default TutorialPromptModal;
