/**
 * IMOBI - Password Strength Indicator Component
 * Visual indicator for password strength
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Check, X } from 'lucide-react-native';
import { useTheme } from '@/app/providers/ThemeProvider';

interface PasswordStrengthProps {
  password: string;
  showRequirements?: boolean;
}

interface Requirement {
  label: string;
  regex: RegExp;
}

const requirements: Requirement[] = [
  { label: 'Minim 8 caractere', regex: /.{8,}/ },
  { label: 'O literă mare', regex: /[A-Z]/ },
  { label: 'O cifră', regex: /[0-9]/ },
  { label: 'Un caracter special (!@#$%^&*)', regex: /[!@#$%^&*]/ },
];

const PasswordStrength: React.FC<PasswordStrengthProps> = ({
  password,
  showRequirements = true,
}) => {
  const { theme } = useTheme();

  const analysis = useMemo(() => {
    const fulfilled = requirements.map((req) => req.regex.test(password));
    const score = fulfilled.filter(Boolean).length;
    
    let strength: 'weak' | 'fair' | 'good' | 'strong' = 'weak';
    let color: string = theme.colors.secondary.error;
    let label = 'Slabă';

    if (score === 4) {
      strength = 'strong';
      color = theme.colors.accent.main;
      label = 'Puternică';
    } else if (score === 3) {
      strength = 'good';
      color = theme.colors.accent.light;
      label = 'Bună';
    } else if (score === 2) {
      strength = 'fair';
      color = theme.colors.secondary.warning;
      label = 'Moderat';
    }

    return { fulfilled, score, strength, color, label };
  }, [password, theme]);

  if (!password) return null;

  return (
    <View style={styles.container}>
      {/* Strength Bar */}
      <View style={styles.barContainer}>
        <View
          style={[
            styles.bar,
            { backgroundColor: theme.colors.divider },
          ]}
        >
          <View
            style={[
              styles.barFill,
              {
                width: `${(analysis.score / 4) * 100}%`,
                backgroundColor: analysis.color,
              },
            ]}
          />
        </View>
        <Text
          style={[
            styles.strengthLabel,
            {
              color: analysis.color,
              fontSize: theme.typography.fontSize.xs,
            },
          ]}
        >
          {analysis.label}
        </Text>
      </View>

      {/* Requirements List */}
      {showRequirements && (
        <View style={styles.requirements}>
          {requirements.map((req, index) => (
            <View key={index} style={styles.requirement}>
              {analysis.fulfilled[index] ? (
                <Check size={14} color={theme.colors.accent.main} />
              ) : (
                <X size={14} color={theme.colors.textTertiary} />
              )}
              <Text
                style={[
                  styles.requirementText,
                  {
                    color: analysis.fulfilled[index]
                      ? theme.colors.accent.main
                      : theme.colors.textTertiary,
                    fontSize: theme.typography.fontSize.xs,
                  },
                ]}
              >
                {req.label}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 2,
  },
  strengthLabel: {
    marginLeft: 12,
    fontWeight: '500',
  },
  requirements: {
    marginTop: 12,
  },
  requirement: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  requirementText: {
    marginLeft: 8,
  },
});

export default PasswordStrength;
