import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Wrench, RefreshCw } from 'lucide-react-native';

import { useTheme } from '@/app/providers/ThemeProvider';
import Button from '@/shared/components/Button';

type Props = {
  message?: string;
  onRetry?: () => void;
};

const MaintenanceScreen: React.FC<Props> = ({
  message = 'Aplicația este în mentenanță. Revino în curând.',
  onRetry,
}) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <LinearGradient
        colors={[
          theme.colors.background,
          theme.colors.background,
          theme.colors.accent.main + '0D',
        ]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={styles.background}
      />

      <View style={styles.content}>
        <View style={styles.center}>
          <View style={styles.iconStack}>
            <View style={[styles.iconGlow, { backgroundColor: theme.colors.accent.main + '12' }]} />
            <View style={[styles.iconCircle, { backgroundColor: theme.colors.accent.main + '12' }]}
            >
              <Wrench size={28} color={theme.colors.accent.main} />
            </View>
          </View>

          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
            Mentenanță sistem
          </Text>

          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            {message}
          </Text>

          {onRetry ? (
            <View style={styles.ctaWrap}>
              <Button
                title="Verifică din nou"
                onPress={onRetry}
                variant="primary"
                size="lg"
                fullWidth
                icon={<RefreshCw size={18} color="#fff" />}
                iconPosition="right"
                style={{ ...styles.ctaButton, backgroundColor: theme.colors.primary.main }}
                textStyle={{ fontFamily: 'Inter-SemiBold' as any }}
              />
            </View>
          ) : null}

          <Text style={[styles.note, { color: theme.colors.textSecondary }]}>Mulțumim pentru răbdare.</Text>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.brand, { color: theme.colors.textSecondary }]}>RIVA</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 28,
    justifyContent: 'space-between',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconStack: {
    position: 'relative',
    width: 110,
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  iconGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 55,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 320,
  },
  ctaWrap: {
    marginTop: 22,
    width: '100%',
    maxWidth: 360,
  },
  ctaButton: {
    borderRadius: 999,
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  note: {
    marginTop: 16,
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    opacity: 0.7,
  },
  footer: {
    paddingTop: 14,
    alignItems: 'center',
  },
  brand: {
    letterSpacing: 6,
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    opacity: 0.7,
  },
});

export default MaintenanceScreen;
