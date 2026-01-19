/**
 * IMOBI - Transaction Type Toggle Component
 * Toggle between Sale and Rent transaction types
 */

import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { DollarSign, Key } from 'lucide-react-native';
import { useTheme } from '@/app/providers/ThemeProvider';

// ============================================
// TYPES
// ============================================

type TransactionType = 'SALE' | 'RENT';

interface TransactionTypeToggleProps {
  value: TransactionType;
  onChange: (type: TransactionType) => void;
}

// ============================================
// COMPONENT
// ============================================

export const TransactionTypeToggle: React.FC<TransactionTypeToggleProps> = ({
  value,
  onChange,
}) => {
  const { theme } = useTheme();
  const slideAnim = useRef(new Animated.Value(value === 'SALE' ? 0 : 1)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: value === 'SALE' ? 0 : 1,
      useNativeDriver: false,
      tension: 50,
      friction: 8,
    }).start();
  }, [value]);

  const translateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 148], // Half of container width minus padding
  });

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
        Tip tranzacție
      </Text>
      <View 
        style={[
          styles.toggleContainer, 
          { 
            backgroundColor: theme.colors.divider,
            borderRadius: theme.borderRadius.lg,
          }
        ]}
      >
        {/* Animated Slider */}
        <Animated.View
          style={[
            styles.slider,
            {
              backgroundColor: theme.colors.primary.main,
              borderRadius: theme.borderRadius.lg - 2,
              transform: [{ translateX }],
              ...theme.shadows.sm,
            },
          ]}
        />

        {/* Sale Option */}
        <TouchableOpacity
          style={styles.option}
          onPress={() => onChange('SALE')}
          activeOpacity={0.8}
          testID="transaction-type-sale"
        >
          <DollarSign 
            size={18} 
            color={value === 'SALE' ? '#ffffff' : theme.colors.textSecondary} 
          />
          <Text
            style={[
              styles.optionText,
              {
                color: value === 'SALE' ? '#ffffff' : theme.colors.textSecondary,
                fontFamily: value === 'SALE' ? 'Inter-SemiBold' : 'Inter-Medium',
              },
            ]}
          >
            Vânzare
          </Text>
        </TouchableOpacity>

        {/* Rent Option */}
        <TouchableOpacity
          style={styles.option}
          onPress={() => onChange('RENT')}
          activeOpacity={0.8}
          testID="transaction-type-rent"
        >
          <Key 
            size={18} 
            color={value === 'RENT' ? '#ffffff' : theme.colors.textSecondary} 
          />
          <Text
            style={[
              styles.optionText,
              {
                color: value === 'RENT' ? '#ffffff' : theme.colors.textSecondary,
                fontFamily: value === 'RENT' ? 'Inter-SemiBold' : 'Inter-Medium',
              },
            ]}
          >
            Închiriere
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 12,
  },
  toggleContainer: {
    flexDirection: 'row',
    padding: 4,
    height: 52,
    position: 'relative',
  },
  slider: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: 148,
    height: 44,
  },
  option: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    zIndex: 1,
  },
  optionText: {
    fontSize: 15,
  },
});

export default TransactionTypeToggle;
