/**
 * RIVA - Search Bar Component
 * Main search input with autocomplete suggestions
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Keyboard,
  FlatList,
} from 'react-native';
import {
  Search,
  X,
  MapPin,
  Clock,
  TrendingUp,
} from 'lucide-react-native';
import { useTheme } from '@/app/providers/ThemeProvider';

// ============================================
// TYPES
// ============================================

interface SearchSuggestion {
  id: string;
  text: string;
  type: 'recent' | 'popular' | 'location';
  subtitle?: string;
}

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: (text: string) => void;
  onSuggestionSelect?: (suggestion: SearchSuggestion) => void;
  placeholder?: string;
  suggestions?: SearchSuggestion[];
  showSuggestions?: boolean;
  autoFocus?: boolean;
}

// ============================================
// COMPONENT
// ============================================

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  onSubmit,
  onSuggestionSelect,
  placeholder = 'Caută după locație...',
  suggestions = [],
  showSuggestions = false,
  autoFocus = false,
}) => {
  const { theme } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const borderAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(borderAnim, {
      toValue: isFocused ? 1 : 0,
      duration: theme.animation.duration.fast,
      useNativeDriver: false,
    }).start();
  }, [isFocused]);

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.colors.border, theme.colors.primary.main],
  });

  const handleClear = () => {
    onChangeText('');
    inputRef.current?.focus();
  };

  const handleSuggestionPress = (suggestion: SearchSuggestion) => {
    onChangeText(suggestion.text);
    onSuggestionSelect?.(suggestion);
    Keyboard.dismiss();
  };

  const getSuggestionIcon = (type: SearchSuggestion['type']) => {
    switch (type) {
      case 'recent':
        return <Clock size={18} color={theme.colors.textTertiary} />;
      case 'popular':
        return <TrendingUp size={18} color={theme.colors.secondary.warning} />;
      case 'location':
        return <MapPin size={18} color={theme.colors.accent.main} />;
      default:
        return <Search size={18} color={theme.colors.textTertiary} />;
    }
  };

  const renderSuggestion = ({ item }: { item: SearchSuggestion }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => handleSuggestionPress(item)}
      activeOpacity={0.7}
    >
      {getSuggestionIcon(item.type)}
      <View style={styles.suggestionContent}>
        <Text 
          style={[styles.suggestionText, { color: theme.colors.textPrimary }]}
          numberOfLines={1}
        >
          {item.text}
        </Text>
        {item.subtitle && (
          <Text 
            style={[styles.suggestionSubtitle, { color: theme.colors.textSecondary }]}
            numberOfLines={1}
          >
            {item.subtitle}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.inputContainer,
          {
            backgroundColor: theme.colors.surface,
            borderColor,
            ...theme.shadows.sm,
          },
        ]}
      >
        <Search size={20} color={theme.colors.textTertiary} style={styles.searchIcon} />
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={() => onSubmit(value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textTertiary}
          style={[
            styles.input,
            {
              color: theme.colors.textPrimary,
            },
          ]}
          autoFocus={autoFocus}
          returnKeyType="search"
        />
        {value.length > 0 && (
          <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
            <X size={18} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        )}
      </Animated.View>

      {/* Suggestions Dropdown */}
      {showSuggestions && isFocused && suggestions.length > 0 && (
        <View 
          style={[
            styles.suggestionsContainer, 
            { 
              backgroundColor: theme.colors.surface,
              ...theme.shadows.lg,
            }
          ]}
        >
          <FlatList
            data={suggestions}
            renderItem={renderSuggestion}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            style={styles.suggestionsList}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 100,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 16,
  },
  searchIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    paddingVertical: 12,
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 58,
    left: 0,
    right: 0,
    borderRadius: 12,
    maxHeight: 280,
    overflow: 'hidden',
  },
  suggestionsList: {
    paddingVertical: 8,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionText: {
    fontSize: 15,
    fontFamily: 'Inter-Medium',
  },
  suggestionSubtitle: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    marginTop: 2,
  },
});

export default SearchBar;
