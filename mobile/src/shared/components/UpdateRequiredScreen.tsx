import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CloudDownload, ArrowRight } from 'lucide-react-native';

import { useTheme } from '@/app/providers/ThemeProvider';
import Button from '@/shared/components/Button';

type Props = {
  currentVersion?: string | null;
  minSupportedVersion?: string | null;
  storeUrl?: string | null;
  onOpenStore?: () => void;
  onRetry?: () => void;
};

const UpdateRequiredScreen: React.FC<Props> = ({
  currentVersion,
  minSupportedVersion,
  storeUrl,
  onOpenStore,
  onRetry,
}) => {
  const { theme } = useTheme();

  const details = [
    currentVersion ? `Versiunea ta: ${currentVersion}` : null,
    minSupportedVersion ? `Minim necesar: ${minSupportedVersion}` : null,
  ].filter(Boolean) as string[];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <LinearGradient
        colors={[
          theme.colors.background,
          theme.colors.background,
          theme.colors.primary.main + '10',
        ]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={styles.background}
      />

      <View style={styles.content}>
        <View style={styles.center}>
          <View style={styles.iconStack}>
            <View style={[styles.iconGlow, { backgroundColor: theme.colors.primary.main + '12' }]} />
            <View style={[styles.iconCircle, { backgroundColor: theme.colors.primary.main + '12' }]}>
              <CloudDownload size={28} color={theme.colors.primary.main} />
            </View>
          </View>

          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
            Versiune nouă disponibilă
          </Text>

          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Avem noutăți! Descarcă ultima versiune pentru o experiență mai rapidă.
          </Text>

          {details.length > 0 ? (
            <View style={[styles.details, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
              {details.map((line) => (
                <Text key={line} style={[styles.detailText, { color: theme.colors.textSecondary }]}>
                  {line}
                </Text>
              ))}
            </View>
          ) : null}

          <View style={styles.ctaWrap}>
            <Button
              title="Updatează acum"
              onPress={onOpenStore ?? (() => {})}
              variant="primary"
              size="lg"
              fullWidth
              disabled={!storeUrl}
              icon={<ArrowRight size={18} color="#fff" />}
              iconPosition="right"
              style={{ ...styles.ctaButton, backgroundColor: theme.colors.primary.main }}
              textStyle={{ fontFamily: 'Inter-SemiBold' as any }}
            />
          </View>

          {onRetry ? (
            <Text
              onPress={onRetry}
              style={[styles.secondaryAction, { color: theme.colors.textSecondary }]}
            >
              Am actualizat
            </Text>
          ) : null}
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
  details: {
    marginTop: 18,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    width: '100%',
    maxWidth: 360,
  },
  detailText: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
    lineHeight: 18,
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
  secondaryAction: {
    marginTop: 14,
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
    opacity: 0.8,
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

export default UpdateRequiredScreen;
