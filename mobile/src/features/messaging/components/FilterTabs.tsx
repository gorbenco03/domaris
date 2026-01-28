/**
 * RIVA - Filter Tabs Component
 * Horizontal tabs for filtering conversations (All, Unread, Archived)
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  LayoutChangeEvent,
  Dimensions,
} from 'react-native';
import { useTheme } from '@/app/providers/ThemeProvider';
import { ConversationFilter } from '../types';

// ============================================
// TYPES
// ============================================

interface FilterTab {
  key: ConversationFilter;
  label: string;
  badge?: number;
}

interface FilterTabsProps {
  activeFilter: ConversationFilter;
  onFilterChange: (filter: ConversationFilter) => void;
  unreadCount?: number;
}

// ============================================
// COMPONENT
// ============================================

const FilterTabs: React.FC<FilterTabsProps> = ({
  activeFilter,
  onFilterChange,
  unreadCount = 0,
}) => {
  const { theme } = useTheme();
  const slideAnim = React.useRef(new Animated.Value(0)).current;
  const [containerWidth, setContainerWidth] = useState(Dimensions.get('window').width - 32);

  const tabs: FilterTab[] = [
    { key: 'all', label: 'Toate' },
    { key: 'unread', label: 'Necitite', badge: unreadCount },
    { key: 'archived', label: 'Arhivate' },
  ];

  const activeIndex = tabs.findIndex((tab) => tab.key === activeFilter);
  const tabWidth = containerWidth / tabs.length;

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    if (width > 0) {
      setContainerWidth(width);
    }
  }, []);

  React.useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: activeIndex * tabWidth,
      damping: 20,
      stiffness: 300,
      useNativeDriver: true,
    }).start();
  }, [activeIndex, tabWidth]);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderBottomColor: theme.colors.border,
        },
      ]}
    >
      <View style={styles.tabsContainer} onLayout={onLayout}>
        {/* Active indicator */}
        <Animated.View
          style={[
            styles.indicator,
            {
              backgroundColor: theme.colors.primary.main,
              transform: [{ translateX: slideAnim }],
              width: tabWidth,
            },
          ]}
        />

        {/* Tabs */}
        {tabs.map((tab) => {
          const isActive = activeFilter === tab.key;

          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tab}
              onPress={() => onFilterChange(tab.key)}
              activeOpacity={0.7}
            >
              <View style={styles.tabContent}>
                <Text
                  style={[
                    styles.tabLabel,
                    {
                      color: isActive
                        ? theme.colors.primary.main
                        : theme.colors.textSecondary,
                      fontWeight: isActive ? '600' : '500',
                    },
                  ]}
                >
                  {tab.label}
                </Text>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <View
                    style={[
                      styles.badge,
                      {
                        backgroundColor: isActive
                          ? theme.colors.primary.main
                          : theme.colors.textTertiary,
                      },
                    ]}
                  >
                    <Text style={styles.badgeText}>
                      {tab.badge > 99 ? '99+' : tab.badge}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    paddingHorizontal: 16,
  },
  tabsContainer: {
    flexDirection: 'row',
    position: 'relative',
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    height: 3,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  tabLabel: {
    fontSize: 14,
  },
  badge: {
    minWidth: 20,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
});

export default FilterTabs;
