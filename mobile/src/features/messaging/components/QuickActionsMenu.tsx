/**
 * IMOBI - Quick Actions Menu Component
 * Bottom sheet with quick action options for chat
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  Animated,
} from 'react-native';
import {
  Calendar,
  MapPin,
  DollarSign,
  FileText,
  Phone,
  X,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/app/providers/ThemeProvider';

// ============================================
// TYPES
// ============================================

interface QuickAction {
  id: string;
  icon: React.ReactNode;
  label: string;
  description?: string;
}

interface QuickActionsMenuProps {
  visible: boolean;
  onClose: () => void;
  onScheduleViewing?: () => void;
  onAskLocation?: () => void;
  onAskPrice?: () => void;
  onUseTemplate?: () => void;
  onCall?: () => void;
  phoneAvailable?: boolean;
}

// ============================================
// COMPONENT
// ============================================

const QuickActionsMenu: React.FC<QuickActionsMenuProps> = ({
  visible,
  onClose,
  onScheduleViewing,
  onAskLocation,
  onAskPrice,
  onUseTemplate,
  onCall,
  phoneAvailable = false,
}) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const slideAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 1,
        damping: 20,
        stiffness: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const actions: QuickAction[] = [
    {
      id: 'schedule',
      icon: <Calendar size={24} color={theme.colors.accent.main} />,
      label: 'Programează vizionare',
      description: 'Alege o dată și oră convenabilă',
    },
    {
      id: 'location',
      icon: <MapPin size={24} color={theme.colors.secondary.info} />,
      label: 'Cere locația exactă',
      description: 'Solicită adresa completă',
    },
    {
      id: 'price',
      icon: <DollarSign size={24} color={theme.colors.secondary.warning} />,
      label: 'Întreabă de preț',
      description: 'Negociabilitate și detalii',
    },
    {
      id: 'template',
      icon: <FileText size={24} color={theme.colors.primary.main} />,
      label: 'Folosește template',
      description: 'Mesaje predefinite',
    },
  ];

  if (phoneAvailable) {
    actions.push({
      id: 'call',
      icon: <Phone size={24} color={theme.colors.accent.dark} />,
      label: 'Sună',
      description: 'Apel telefonic direct',
    });
  }

  const handleAction = (actionId: string) => {
    switch (actionId) {
      case 'schedule':
        onScheduleViewing?.();
        break;
      case 'location':
        onAskLocation?.();
        break;
      case 'price':
        onAskPrice?.();
        break;
      case 'template':
        onUseTemplate?.();
        break;
      case 'call':
        onCall?.();
        break;
    }
    onClose();
  };

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [300, 0],
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Animated.View
          style={[
            styles.container,
            {
              backgroundColor: theme.colors.surface,
              borderTopLeftRadius: theme.borderRadius['2xl'],
              borderTopRightRadius: theme.borderRadius['2xl'],
              paddingBottom: insets.bottom + 16,
              transform: [{ translateY }],
            },
          ]}
        >
          {/* Handle */}
          <View style={styles.handleContainer}>
            <View
              style={[
                styles.handle,
                { backgroundColor: theme.colors.border },
              ]}
            />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text
              style={[
                styles.title,
                { color: theme.colors.textPrimary },
              ]}
            >
              Acțiuni rapide
            </Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={24} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Actions list */}
          <View style={styles.actionsList}>
            {actions.map((action, index) => (
              <TouchableOpacity
                key={action.id}
                style={[
                  styles.actionItem,
                  {
                    borderBottomColor: theme.colors.divider,
                    borderBottomWidth: index < actions.length - 1 ? 1 : 0,
                  },
                ]}
                onPress={() => handleAction(action.id)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.actionIcon,
                    { backgroundColor: `${theme.colors.primary.main}10` },
                  ]}
                >
                  {action.icon}
                </View>
                <View style={styles.actionContent}>
                  <Text
                    style={[
                      styles.actionLabel,
                      { color: theme.colors.textPrimary },
                    ]}
                  >
                    {action.label}
                  </Text>
                  {action.description && (
                    <Text
                      style={[
                        styles.actionDescription,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      {action.description}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      </Pressable>
    </Modal>
  );
};

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    paddingTop: 8,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -8,
  },
  actionsList: {
    paddingTop: 8,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  actionContent: {
    flex: 1,
  },
  actionLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  actionDescription: {
    fontSize: 13,
  },
});

export default QuickActionsMenu;
