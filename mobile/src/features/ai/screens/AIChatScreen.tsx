/**
 * RIVA - AI Chat Screen
 * Persistent conversational AI assistant with client classification
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Send,
  Sparkles,
  Plus,
  MessageSquare,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';

import { useTheme } from '@/app/providers/ThemeProvider';
import { IconButton } from '@/shared/components';
import { useAiChat } from '../hooks/useAiChat';
import AiPropertyCard from '../components/AiPropertyCard';

/**
 * Remove markdown formatting from text
 */
const cleanMarkdown = (text: string): string => {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    .replace(/`(.*?)`/g, '$1')
    .replace(/#{1,6}\s/g, '')
    .trim();
};

const AIChatScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const scrollViewRef = useRef<ScrollView>(null);
  const [inputText, setInputText] = useState('');

  const {
    messages,
    isLoading,
    isSending,
    clientProfile,
    loadConversation,
    sendMessage,
    startNewConversation,
  } = useAiChat();

  // Get conversationId from route params if navigating from list
  const routeConversationId = (route.params as any)?.conversationId;

  useEffect(() => {
    loadConversation(routeConversationId);
  }, [routeConversationId]);

  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 150);
  }, [messages]);

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text) return;
    setInputText('');
    await sendMessage(text);
  }, [inputText, sendMessage]);

  const handleQuickReply = useCallback((text: string) => {
    setInputText('');
    sendMessage(text);
  }, [sendMessage]);

  const handleViewProperty = useCallback((propertyId: number) => {
    // @ts-ignore
    navigation.navigate('PropertyDetail', { propertyId: String(propertyId) });
  }, [navigation]);

  const handleScheduleViewing = useCallback((propertyId: number, title: string) => {
    sendMessage(`Vreau sa vizionez proprietatea "${title}" (ID: ${propertyId}). Ce date si ore sunt disponibile?`);
  }, [sendMessage]);

  const handleOpenConversationsList = useCallback(() => {
    // @ts-ignore
    navigation.navigate('AiConversationsList');
  }, [navigation]);

  // Quick suggestions for first-time users
  const quickSuggestions = [
    'Vreau sa inchiriez',
    'Vreau sa cumpar',
    'Apartament in Botanica',
    '2 camere sub 400\u20AC',
  ];

  const classificationScore = clientProfile?.classificationScore || 0;
  const showClassificationBar = !clientProfile?.classificationComplete && classificationScore > 0;

  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        edges={['top']}
      >
        <View style={styles.loadingContainer}>
          <LinearGradient
            colors={['#6366f1', '#8b5cf6', '#10b981']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.loadingIcon}
          >
            <Sparkles size={28} color="#ffffff" />
          </LinearGradient>
          <ActivityIndicator
            size="small"
            color={theme.colors.primary.main}
            style={{ marginTop: 16 }}
          />
          <Text
            style={[
              styles.loadingText,
              { color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.sm },
            ]}
          >
            Se incarca conversatia...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

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
        <View style={styles.headerCenter}>
          <LinearGradient
            colors={['#6366f1', '#8b5cf6', '#10b981']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.aiIconGradient}
          >
            <Sparkles size={20} color="#ffffff" />
          </LinearGradient>
          <View style={styles.headerTextContainer}>
            <Text
              style={[
                styles.headerTitle,
                {
                  color: theme.colors.textPrimary,
                  fontSize: theme.typography.fontSize.base,
                },
              ]}
            >
              RIVA AI
            </Text>
            <Text
              style={[
                styles.headerSubtitle,
                {
                  color: theme.colors.textSecondary,
                  fontSize: theme.typography.fontSize.xs,
                },
              ]}
            >
              {clientProfile?.classificationComplete
                ? 'Consultant imobiliar'
                : 'Te cunosc mai bine...'}
            </Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={handleOpenConversationsList}
          >
            <MessageSquare size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={startNewConversation}
          >
            <Plus size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Classification Progress Bar */}
      {showClassificationBar && (
        <View
          style={[
            styles.classificationBar,
            { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border },
          ]}
        >
          <Text
            style={[
              styles.classificationLabel,
              { color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.xs },
            ]}
          >
            Clasificare client: {classificationScore}%
          </Text>
          <View
            style={[styles.progressTrack, { backgroundColor: theme.colors.border }]}
          >
            <LinearGradient
              colors={['#6366f1', '#10b981']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.progressFill, { width: `${classificationScore}%` }]}
            />
          </View>
        </View>
      )}

      {/* Chat Messages */}
      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={100}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={[
            styles.messagesContent,
            { paddingHorizontal: theme.spacing[4] },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((message) => (
            <View key={message.id} style={styles.messageWrapper}>
              {message.role === 'assistant' ? (
                <View style={styles.assistantMessageContainer}>
                  <LinearGradient
                    colors={['#6366f1', '#8b5cf6', '#10b981']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.assistantAvatar}
                  >
                    <Sparkles size={16} color="#ffffff" />
                  </LinearGradient>
                  <View
                    style={[
                      styles.messageBubble,
                      styles.assistantBubble,
                      {
                        backgroundColor: theme.colors.surface,
                        borderColor: theme.colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.messageText,
                        {
                          color: theme.colors.textPrimary,
                          fontSize: theme.typography.fontSize.sm,
                        },
                      ]}
                      selectable
                    >
                      {cleanMarkdown(message.content)}
                    </Text>

                    {/* Property Cards */}
                    {message.properties && message.properties.length > 0 && (
                      <View style={{ marginTop: 12, gap: 10 }}>
                        {message.properties.map((property: any) => (
                          <AiPropertyCard
                            key={property.id}
                            property={property}
                            onView={handleViewProperty}
                            onSchedule={handleScheduleViewing}
                          />
                        ))}
                      </View>
                    )}

                    {/* Suggested Actions / Quick Replies */}
                    {message.suggestedActions && message.suggestedActions.length > 0 && (
                      <View style={styles.suggestedActionsContainer}>
                        {message.suggestedActions.map((action, idx) => (
                          <TouchableOpacity
                            key={idx}
                            style={[
                              styles.actionChip,
                              {
                                backgroundColor: theme.colors.primary.main + '12',
                                borderColor: theme.colors.primary.main + '30',
                              },
                            ]}
                            onPress={() => handleQuickReply(action.label)}
                          >
                            <Text
                              style={[
                                styles.actionChipText,
                                {
                                  color: theme.colors.primary.main,
                                  fontSize: theme.typography.fontSize.xs,
                                },
                              ]}
                            >
                              {action.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                </View>
              ) : (
                <View
                  style={[
                    styles.messageBubble,
                    styles.userBubble,
                    {
                      backgroundColor: theme.colors.primary.main,
                      alignSelf: 'flex-end',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.messageText,
                      {
                        color: '#ffffff',
                        fontSize: theme.typography.fontSize.sm,
                      },
                    ]}
                  >
                    {message.content}
                  </Text>
                </View>
              )}
            </View>
          ))}

          {/* Typing Indicator */}
          {isSending && (
            <View style={styles.assistantMessageContainer}>
              <LinearGradient
                colors={['#6366f1', '#8b5cf6', '#10b981']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.assistantAvatar}
              >
                <Sparkles size={16} color="#ffffff" />
              </LinearGradient>
              <View
                style={[
                  styles.typingIndicator,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <View style={styles.typingDots}>
                  <View
                    style={[styles.dot, { backgroundColor: theme.colors.textTertiary }]}
                  />
                  <View
                    style={[styles.dot, { backgroundColor: theme.colors.textTertiary }]}
                  />
                  <View
                    style={[styles.dot, { backgroundColor: theme.colors.textTertiary }]}
                  />
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input Area */}
        <View
          style={[
            styles.inputContainer,
            {
              backgroundColor: theme.colors.surface,
              borderTopColor: theme.colors.border,
            },
          ]}
        >
          {/* Quick Suggestions - only on first messages */}
          {messages.length <= 2 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.suggestionsScroll}
              contentContainerStyle={[
                styles.suggestionsContent,
                { paddingHorizontal: theme.spacing[4] },
              ]}
            >
              <Text
                style={[
                  styles.suggestionLabel,
                  {
                    color: theme.colors.textSecondary,
                    fontSize: theme.typography.fontSize.xs,
                    marginRight: theme.spacing[2],
                  },
                ]}
              >
                Sugestii:
              </Text>
              {quickSuggestions.map((suggestion, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.suggestionChip,
                    {
                      backgroundColor: theme.colors.primary.main + '15',
                      borderColor: theme.colors.primary.main + '30',
                      borderRadius: theme.borderRadius.full,
                    },
                  ]}
                  onPress={() => handleQuickReply(suggestion)}
                >
                  <Text
                    style={[
                      styles.suggestionText,
                      {
                        color: theme.colors.primary.main,
                        fontSize: theme.typography.fontSize.sm,
                      },
                    ]}
                  >
                    {suggestion}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* Input Field */}
          <View
            style={[
              styles.inputWrapper,
              { paddingHorizontal: theme.spacing[4] },
            ]}
          >
            <View
              style={[
                styles.inputField,
                {
                  backgroundColor: theme.colors.background,
                  borderColor: theme.colors.border,
                  borderRadius: theme.borderRadius.full,
                },
              ]}
            >
              <TextInput
                style={[
                  styles.textInput,
                  {
                    color: theme.colors.textPrimary,
                    fontSize: theme.typography.fontSize.base,
                  },
                ]}
                placeholder="Scrie mesajul tau..."
                placeholderTextColor={theme.colors.textTertiary}
                value={inputText}
                onChangeText={setInputText}
                multiline
                maxLength={500}
                onSubmitEditing={handleSend}
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  {
                    backgroundColor: inputText.trim()
                      ? theme.colors.primary.main
                      : theme.colors.textTertiary + '30',
                  },
                ]}
                onPress={handleSend}
                disabled={!inputText.trim() || isSending}
              >
                <Send
                  size={18}
                  color={inputText.trim() ? '#ffffff' : theme.colors.textTertiary}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  aiIconGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextContainer: {},
  headerTitle: {
    fontWeight: '600',
  },
  headerSubtitle: {},
  headerActions: {
    flexDirection: 'row',
    gap: 4,
  },
  headerBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  classificationBar: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    gap: 4,
  },
  classificationLabel: {
    fontWeight: '500',
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: 16,
  },
  messageWrapper: {
    marginBottom: 16,
  },
  assistantMessageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  assistantAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
    maxWidth: '80%',
  },
  assistantBubble: {
    flex: 1,
    borderWidth: 1,
    borderTopLeftRadius: 4,
  },
  userBubble: {
    borderBottomRightRadius: 4,
  },
  messageText: {
    lineHeight: 20,
  },
  suggestedActionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  actionChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  actionChipText: {
    fontWeight: '500',
  },
  typingIndicator: {
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderTopLeftRadius: 4,
  },
  typingDots: {
    flexDirection: 'row',
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  inputContainer: {
    borderTopWidth: 1,
    paddingBottom: 8,
  },
  suggestionsScroll: {
    minHeight: 56,
  },
  suggestionsContent: {
    paddingVertical: 12,
    paddingRight: 16,
    gap: 8,
    alignItems: 'center',
    flexDirection: 'row',
  },
  suggestionLabel: {
    fontWeight: '500',
  },
  suggestionChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    marginVertical: 2,
  },
  suggestionText: {
    fontWeight: '500',
  },
  inputWrapper: {
    paddingTop: 8,
  },
  inputField: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingLeft: 16,
    paddingRight: 4,
    paddingVertical: 4,
    borderWidth: 1,
  },
  textInput: {
    flex: 1,
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AIChatScreen;
