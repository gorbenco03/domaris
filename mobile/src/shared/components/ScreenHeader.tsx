/**
 * IMOBI - Screen Header
 * Consistent back button + title header.
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft } from 'lucide-react-native';
import { useTheme } from '@/app/providers/ThemeProvider';
import IconButton from './IconButton';

interface ScreenHeaderProps {
  title: string;
  onBackPress?: () => void;
  rightSlot?: React.ReactNode;
  style?: ViewStyle;
}

const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  onBackPress,
  rightSlot,
  style,
}) => {
  const { theme } = useTheme();
  const navigation = useNavigation();

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      navigation.goBack();
    }
  };

  return (
    <View
      style={[
        styles.header,
        {
          backgroundColor: theme.colors.surface,
          borderBottomColor: theme.colors.border,
        },
        style,
      ]}
    >
      <IconButton
        icon={<ArrowLeft size={22} color={theme.colors.textPrimary} />}
        onPress={handleBack}
        variant="surface"
        size="md"
        style={[
          styles.backButton,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}
      />
      <Text
        style={[
          styles.headerTitle,
          {
            color: theme.colors.textPrimary,
            fontSize: theme.typography.fontSize.lg,
          },
        ]}
      >
        {title}
      </Text>
      <View style={styles.rightSlot}>
        {rightSlot || <View style={{ width: 44 }} />}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    borderWidth: 1,
    borderRadius: 12,
  },
  headerTitle: {
    fontWeight: '600',
  },
  rightSlot: {
    width: 44,
    alignItems: 'flex-end',
  },
});

export default ScreenHeader;
