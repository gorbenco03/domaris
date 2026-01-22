/**
 * IMOBI - Conversations List Screen
 * Main messaging screen showing all conversations
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Search, X } from 'lucide-react-native';

import { useTheme } from '@/app/providers/ThemeProvider';
import { MessagesStackParamList } from '@/app/navigation/types';
import { ConversationFilter } from '../types';
import {
  ConversationItem,
  FilterTabs,
  EmptyConversations,
} from '../components';
import { useConversations } from '../hooks/useMessaging';
import type { IConversationListItem } from '@domaris/types';

// ============================================
// COMPONENT
// ============================================

type NavigationProp = NativeStackNavigationProp<MessagesStackParamList>;

const ConversationsListScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();

  const [filter, setFilter] = useState<ConversationFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Fetch conversations based on filter
  const {
    data: conversations = [],
    isLoading,
    refetch,
    isFetching,
  } = useConversations({
    type: filter,
  });

  // Filter by search query locally
  const filteredConversations = useMemo(() => {
    if (!searchQuery) return conversations;

    const query = searchQuery.toLowerCase();
    return conversations.filter((conv) => {
      const matchName = `${conv.otherParticipant.firstName} ${conv.otherParticipant.lastName}`
        .toLowerCase()
        .includes(query);
      const matchProperty = conv.property.title.toLowerCase().includes(query);
      return matchName || matchProperty;
    });
  }, [conversations, searchQuery]);

  // Calculate unread count
  const unreadCount = useMemo(() => {
    return conversations.reduce((acc, conv) => acc + conv.unreadCount, 0);
  }, [conversations]);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleConversationPress = (conversationId: string) => {
    const conversation = conversations.find((c) => c.id === conversationId);
    navigation.navigate('Chat', {
      conversationId,
      propertyId: conversation?.property?.id,
      recipientName: conversation?.otherParticipant
        ? `${conversation.otherParticipant.firstName} ${conversation.otherParticipant.lastName}`
        : 'Utilizator',
    });
  };

  const handleSearchProperties = () => {
    // Navigate to search
    // navigation.navigate('Search');
  };

  const renderItem = ({ item }: { item: IConversationListItem }) => (
    <ConversationItem
      conversation={item as any}
      onPress={handleConversationPress}
    />
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        {isSearching ? (
          <View style={styles.searchRow}>
            <View
              style={[
                styles.searchInputContainer,
                { backgroundColor: theme.colors.surface },
              ]}
            >
              <Search size={20} color={theme.colors.textTertiary} />
              <TextInput
                style={[styles.searchInput, { color: theme.colors.textPrimary }]}
                placeholder="Caută conversații..."
                placeholderTextColor={theme.colors.textTertiary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <X size={18} color={theme.colors.textTertiary} />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              onPress={() => {
                setIsSearching(false);
                setSearchQuery('');
              }}
              style={styles.cancelButton}
            >
              <Text style={[styles.cancelText, { color: theme.colors.primary.main }]}>
                Anulează
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
              Mesaje
            </Text>
            <TouchableOpacity
              onPress={() => setIsSearching(true)}
              style={styles.searchButton}
            >
              <Search size={22} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Filter Tabs */}
      <FilterTabs
        activeFilter={filter}
        onFilterChange={setFilter}
        unreadCount={unreadCount}
      />

      {/* Loading State */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary.main} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            Se încarcă conversațiile...
          </Text>
        </View>
      )}

      {/* Conversations List */}
      {!isLoading && (
        <FlatList
          data={filteredConversations}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={
            filteredConversations.length === 0 ? styles.emptyContent : undefined
          }
          ListEmptyComponent={
            <EmptyConversations
              filter={filter}
              onSearchProperties={handleSearchProperties}
            />
          }
          refreshControl={
            <RefreshControl
              refreshing={isFetching}
              onRefresh={handleRefresh}
              tintColor={theme.colors.primary.main}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  searchButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  cancelButton: {
    paddingVertical: 8,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '500',
  },
  emptyContent: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
});

export default ConversationsListScreen;
