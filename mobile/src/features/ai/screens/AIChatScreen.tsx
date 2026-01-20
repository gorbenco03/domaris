/**
 * IMOBI - AI Chat Screen
 * Conversational AI assistant for property search
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Send,
  Sparkles,
  Home,
  MessageCircle,
  TrendingUp,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';

import { useTheme } from '@/app/providers/ThemeProvider';
import { Button } from '@/shared/components';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  properties?: PropertySuggestion[];
}

interface PropertySuggestion {
  id: string;
  title: string;
  location: string;
  price: string;
  area: string;
  matchScore: number;
}

const AIChatScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const scrollViewRef = useRef<ScrollView>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content:
        'Bună! Sunt IMOBI AI, asistentul tău imobiliar. 🏠\n\nSpune-mi ce cauți și îți găsesc cele mai potrivite opțiuni!\n\nPoți să-mi spui, de exemplu:\n• "Caut apartament 2 camere..."\n• "Vreau casă cu grădină..."\n• "Ceva aproape de centru..."',
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Mock suggestions
  const quickSuggestions = [
    'Cu parcare',
    'Renovat recent',
    'Mobilat',
    'Etaj intermediar',
  ];

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content:
          'Am înțeles perfect! 🎯\n\nAm găsit 8 apartamente potrivite pentru criteriile tale.',
        timestamp: new Date(),
        properties: [
          {
            id: '1',
            title: 'Apartament 3 camere',
            location: 'Drumul Taberei',
            price: '85.000€',
            area: '68mp',
            matchScore: 95,
          },
          {
            id: '2',
            title: 'Apartament 2 camere',
            location: 'Titan',
            price: '78.000€',
            area: '55mp',
            matchScore: 92,
          },
        ],
      };
      setMessages((prev) => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const handleQuickSuggestion = (suggestion: string) => {
    setInputText(suggestion);
  };

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

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
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
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
              IMOBI AI
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
              Asistent imobiliar
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.menuButton}>
          <MessageCircle size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>

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
                    >
                      {message.content}
                    </Text>

                    {/* Property Suggestions */}
                    {message.properties && message.properties.length > 0 && (
                      <View
                        style={[
                          styles.propertiesContainer,
                          { marginTop: theme.spacing[3] },
                        ]}
                      >
                        {message.properties.map((property) => (
                          <TouchableOpacity
                            key={property.id}
                            style={[
                              styles.propertyCard,
                              {
                                backgroundColor: theme.colors.background,
                                borderColor: theme.colors.border,
                                borderRadius: theme.borderRadius.lg,
                                ...theme.shadows.sm,
                              },
                            ]}
                          >
                            <View style={styles.propertyHeader}>
                              <View style={styles.matchBadge}>
                                <TrendingUp
                                  size={12}
                                  color={theme.colors.accent.main}
                                />
                                <Text
                                  style={[
                                    styles.matchScore,
                                    {
                                      color: theme.colors.accent.main,
                                      fontSize: theme.typography.fontSize.xs,
                                    },
                                  ]}
                                >
                                  {property.matchScore}% Potrivire
                                </Text>
                              </View>
                            </View>
                            <Text
                              style={[
                                styles.propertyTitle,
                                {
                                  color: theme.colors.textPrimary,
                                  fontSize: theme.typography.fontSize.base,
                                  marginTop: theme.spacing[2],
                                },
                              ]}
                            >
                              {property.title}
                            </Text>
                            <Text
                              style={[
                                styles.propertyLocation,
                                {
                                  color: theme.colors.textSecondary,
                                  fontSize: theme.typography.fontSize.sm,
                                  marginTop: theme.spacing[1],
                                },
                              ]}
                            >
                              📍 {property.location} • {property.area}
                            </Text>
                            <View
                              style={[
                                styles.propertyFooter,
                                { marginTop: theme.spacing[2] },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.propertyPrice,
                                  {
                                    color: theme.colors.accent.main,
                                    fontSize: theme.typography.fontSize.lg,
                                  },
                                ]}
                              >
                                {property.price}
                              </Text>
                              <View style={styles.propertyActions}>
                                <Button
                                  title="Vezi"
                                  onPress={() => {}}
                                  variant="secondary"
                                  size="sm"
                                />
                                <Button
                                  title="💬 Contact"
                                  onPress={() => {}}
                                  variant="primary"
                                  size="sm"
                                />
                              </View>
                            </View>
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
          {isTyping && (
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
          {/* Quick Suggestions */}
          {messages.length <= 2 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.suggestionsContainer}
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
                💡 Sugestii:
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
                  onPress={() => handleQuickSuggestion(suggestion)}
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
                placeholder="Scrie mesajul tău..."
                placeholderTextColor={theme.colors.textTertiary}
                value={inputText}
                onChangeText={setInputText}
                multiline
                maxLength={500}
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
                disabled={!inputText.trim()}
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
  menuButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
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
  propertiesContainer: {
    gap: 12,
  },
  propertyCard: {
    padding: 12,
    borderWidth: 1,
  },
  propertyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  matchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  matchScore: {
    fontWeight: '600',
  },
  propertyTitle: {
    fontWeight: '600',
  },
  propertyLocation: {},
  propertyFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  propertyPrice: {
    fontWeight: '700',
  },
  propertyActions: {
    flexDirection: 'row',
    gap: 8,
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
  suggestionsContainer: {
    maxHeight: 50,
  },
  suggestionsContent: {
    paddingVertical: 12,
    gap: 8,
    alignItems: 'center',
  },
  suggestionLabel: {
    fontWeight: '500',
  },
  suggestionChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
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
