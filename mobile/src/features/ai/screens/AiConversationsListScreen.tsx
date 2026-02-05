/**
 * RIVA - AI Conversations List Screen
 * Shows history of AI conversations with preview
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Plus,
  Sparkles,
  MessageSquare,
  Trash2,
  Clock,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';

import { useTheme } from '@/app/providers/ThemeProvider';
import { IconButton, EmptyState } from '@/shared/components';
import { aiApi, IAiConversationSummary } from '../api/aiApi';

const AiConversationsListScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const [conversations, setConversations] = useState<IAiConversationSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadConversations = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data } = await aiApi.getConversations();
      setConversations(data);
    } catch (err) {
      // Silently handle - empty state will show
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const handleOpenConversation = useCallback((conversationId: number) => {
    // @ts-ignore
    navigation.navigate('AIChat', { conversationId });
  }, [navigation]);

  const handleNewConversation = useCallback(() => {
    // @ts-ignore
    navigation.navigate('AIChat', { conversationId: undefined });
  }, [navigation]);

  const handleArchive = useCallback(async (id: number) => {
    Alert.alert(
      'Arhiveaza conversatia',
      'Esti sigur ca vrei sa arhivezi aceasta conversatie?',
      [
        { text: 'Anuleaza', style: 'cancel' },
        {
          text: 'Arhiveaza',
          style: 'destructive',
          onPress: async () => {
            try {
              await aiApi.archiveConversation(id);
              setConversations(prev => prev.filter(c => c.id !== id));
            } catch (err) {
              // ignore
            }
          },
        },
      ],
    );
  }, []);

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Acum';
    if (diffMins < 60) return `${diffMins} min`;
    if (diffHours < 24) return `${diffHours} ore`;
    if (diffDays < 7) return `${diffDays} zile`;
    return date.toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' });
  };

  const renderItem = ({ item }: { item: IAiConversationSummary }) => (
    <TouchableOpacity
      style={[
        styles.conversationCard,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.borderRadius.lg,
        },
      ]}
      onPress={() => handleOpenConversation(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <LinearGradient
          colors={['#6366f1', '#8b5cf6', '#10b981']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.cardIcon}
        >
          <Sparkles size={14} color="#ffffff" />
        </LinearGradient>

        <View style={styles.cardContent}>
          <Text
            style={[
              styles.cardTitle,
              {
                color: theme.colors.textPrimary,
                fontSize: theme.typography.fontSize.sm,
              },
            ]}
            numberOfLines={1}
          >
            {item.title || 'Conversatie noua'}
          </Text>

          {item.lastMessage && (
            <Text
              style={[
                styles.cardPreview,
                {
                  color: theme.colors.textSecondary,
                  fontSize: theme.typography.fontSize.xs,
                },
              ]}
              numberOfLines={2}
            >
              {item.lastMessage.role === 'assistant' ? 'RIVA: ' : 'Tu: '}
              {item.lastMessage.content}
            </Text>
          )}
        </View>

        <View style={styles.cardMeta}>
          <View style={styles.timeRow}>
            <Clock size={10} color={theme.colors.textTertiary} />
            <Text
              style={[
                styles.timeText,
                { color: theme.colors.textTertiary, fontSize: theme.typography.fontSize.xs },
              ]}
            >
              {item.lastMessageAt ? formatDate(item.lastMessageAt) : ''}
            </Text>
          </View>

          {/* Classification badge */}
          {item.clientProfile?.classificationComplete ? (
            <View
              style={[
                styles.badge,
                { backgroundColor: '#10b98120', borderColor: '#10b98140' },
              ]}
            >
              <Text style={[styles.badgeText, { color: '#10b981' }]}>
                Clasificat
              </Text>
            </View>
          ) : (
            <View
              style={[
                styles.badge,
                { backgroundColor: '#f59e0b20', borderColor: '#f59e0b40' },
              ]}
            >
              <Text style={[styles.badgeText, { color: '#f59e0b' }]}>
                {item.clientProfile?.classificationScore || 0}%
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Quick stats */}
      <View
        style={[
          styles.cardFooter,
          { borderTopColor: theme.colors.border },
        ]}
      >
        <View style={styles.statsRow}>
          <MessageSquare size={12} color={theme.colors.textTertiary} />
          <Text
            style={[
              styles.statText,
              { color: theme.colors.textTertiary, fontSize: theme.typography.fontSize.xs },
            ]}
          >
            {item.messageCount} mesaje
          </Text>
        </View>

        <TouchableOpacity
          style={styles.archiveBtn}
          onPress={() => handleArchive(item.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Trash2 size={14} color={theme.colors.textTertiary} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.colors.surface,
            borderBottomColor: theme.colors.border,
          },
        ]}
      >
        <IconButton
          icon={<ArrowLeft size={22} color={theme.colors.textPrimary} />}
          onPress={() => navigation.goBack()}
          variant="surface"
          size="md"
          style={[styles.backButton, { borderWidth: 1, borderColor: theme.colors.border }]}
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
          Conversatii AI
        </Text>
        <TouchableOpacity
          style={[
            styles.newBtn,
            { backgroundColor: theme.colors.primary.main },
          ]}
          onPress={handleNewConversation}
        >
          <Plus size={18} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary.main} />
        </View>
      ) : conversations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <EmptyState
            title="Nicio conversatie"
            message="Incepe o conversatie noua cu RIVA AI pentru a gasi proprietatea perfecta."
            icon={<Sparkles size={48} color={theme.colors.textTertiary} />}
          />
          <TouchableOpacity
            style={[
              styles.startBtn,
              { backgroundColor: theme.colors.primary.main, borderRadius: theme.borderRadius.lg },
            ]}
            onPress={handleNewConversation}
          >
            <Text style={styles.startBtnText}>Conversatie noua</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontWeight: '600',
  },
  newBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  startBtn: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    marginTop: 20,
  },
  startBtnText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  conversationCard: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    padding: 14,
    gap: 12,
  },
  cardIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  cardContent: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    fontWeight: '600',
  },
  cardPreview: {
    lineHeight: 18,
  },
  cardMeta: {
    alignItems: 'flex-end',
    gap: 6,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  timeText: {},
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {},
  archiveBtn: {
    padding: 4,
  },
});

export default AiConversationsListScreen;
