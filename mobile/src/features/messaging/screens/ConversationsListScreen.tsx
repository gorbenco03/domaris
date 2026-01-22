/**
 * IMOBI - Conversations List Screen
 * Main messaging screen showing all conversations
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Search, X } from 'lucide-react-native';

import { useTheme } from '@/app/providers/ThemeProvider';
import { MessagesStackParamList } from '@/app/navigation/types';
import { Conversation, ConversationFilter } from '../types';
import {
  ConversationItem,
  FilterTabs,
  EmptyConversations,
} from '../components';

// ============================================
// MOCK DATA
// ============================================

const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: '1',
    propertyId: 'prop-1',
    participants: [
      { userId: 'u1', role: 'OWNER' },
      { userId: 'u2', role: 'INQUIRER' }
    ],
    lastMessage: {
      id: 'msg-1',
      conversationId: '1',
      senderId: 'u1',
      type: 'text',
      content: 'Când putem programa o vizionare pentru apartament?',
      status: 'delivered',
      createdAt: new Date(Date.now() - 15 * 60 * 1000),
    },
    unreadCount: 2,
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
    property: {
      id: 'prop-1',
      title: 'Apartament 3 camere Drumul Taberei',
      price: 95000,
      currency: 'EUR',
      type: 'sale',
    },
    otherParticipant: {
      id: 'u1',
      name: 'Ion Popescu',
      isOnline: true,
    },
  },
  {
    id: '2',
    propertyId: 'prop-2',
    participants: [
      { userId: 'u3', role: 'OWNER' },
      { userId: 'u2', role: 'INQUIRER' }
    ],
    lastMessage: {
      id: 'msg-2',
      conversationId: '2',
      senderId: 'u2',
      type: 'text',
      content: 'Da, prețul e negociabil. Putem discuta.',
      status: 'read',
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    },
    unreadCount: 0,
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
    property: {
      id: 'prop-2',
      title: 'Casă cu 4 camere în Pipera',
      price: 285000,
      currency: 'EUR',
      type: 'sale',
    },
    otherParticipant: {
      id: 'u3',
      name: 'Maria Ionescu',
      isOnline: false,
    },
  },
];


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
  const [refreshing, setRefreshing] = useState(false);

  // Filter conversations
  const filteredConversations = MOCK_CONVERSATIONS.filter((conv) => {
    // Apply filter
    if (filter === 'unread' && conv.unreadCount === 0) return false;
    if (filter === 'archived' && conv.status !== 'archived') return false;
    if (filter === 'all' && conv.status === 'archived') return false;

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchName = conv.otherParticipant?.name.toLowerCase().includes(query);
      const matchProperty = conv.property?.title.toLowerCase().includes(query);
      if (!matchName && !matchProperty) return false;
    }

    return true;
  });

  const unreadCount = MOCK_CONVERSATIONS.reduce(
    (acc, conv) => acc + conv.unreadCount,
    0
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleConversationPress = (conversationId: string) => {
    const conversation = MOCK_CONVERSATIONS.find((c) => c.id === conversationId);
    navigation.navigate('Chat', {
      conversationId,
      propertyId: conversation?.propertyId,
      recipientName: conversation?.otherParticipant?.name,
    });
  };

  const handleSearchProperties = () => {
    // Navigate to search
  };

  const renderItem = ({ item }: { item: Conversation }) => (
    <ConversationItem
      conversation={item}
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

      {/* Conversations List */}
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
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary.main}
          />
        }
        showsVerticalScrollIndicator={false}
      />
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
});

export default ConversationsListScreen;
