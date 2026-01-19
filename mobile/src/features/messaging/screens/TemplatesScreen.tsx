/**
 * IMOBI - Templates Screen
 * Manage quick response templates for messaging
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft, Plus, Trash2, Edit2, MessageSquare } from 'lucide-react-native';

import { useTheme } from '@/app/providers/ThemeProvider';
import { MessagesStackParamList } from '@/app/navigation/types';
import { MessageTemplate } from '../types';
import Button from '@/shared/components/Button';
import Input from '@/shared/components/Input';
import Card from '@/shared/components/Card';

// ============================================
// MOCK DATA
// ============================================

const INITIAL_TEMPLATES: MessageTemplate[] = [
  {
    id: '1',
    title: 'Interesat',
    content: 'Bună ziua! Sunt foarte interesat de proprietatea dumneavoastră. Când am putea stabili o vizionare?',
    type: 'greeting',
    isSystem: true,
  },
  {
    id: '2',
    title: 'Disponibilitate',
    content: 'Bună ziua! Mai este valabil anunțul pentru proprietatea din Drumul Taberei?',
    type: 'question',
    isSystem: true,
  },
  {
    id: '3',
    title: 'Preț negociabil',
    content: 'Bună ziua! Prețul afișat este negociabil? Vă mulțumesc.',
    type: 'question',
    isSystem: false,
  },
];

// ============================================
// COMPONENT
// ============================================

type NavigationProp = NativeStackNavigationProp<MessagesStackParamList, 'Templates'>;

const TemplatesScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();

  const [templates, setTemplates] = useState<MessageTemplate[]>(INITIAL_TEMPLATES);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');

  const handleAddPress = () => {
    setEditingTemplate(null);
    setNewTitle('');
    setNewContent('');
    setIsModalVisible(true);
  };

  const handleEditPress = (template: MessageTemplate) => {
    if (template.isSystem) return;
    setEditingTemplate(template);
    setNewTitle(template.title);
    setNewContent(template.content);
    setIsModalVisible(true);
  };

  const handleDeletePress = (id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
  };

  const handleSave = () => {
    if (!newTitle || !newContent) return;

    if (editingTemplate) {
      setTemplates(prev => prev.map(t => 
        t.id === editingTemplate.id 
          ? { ...t, title: newTitle, content: newContent }
          : t
      ));
    } else {
      const newTemplate: MessageTemplate = {
        id: Date.now().toString(),
        title: newTitle,
        content: newContent,
        type: 'response',
        isSystem: false,
      };
      setTemplates(prev => [...prev, newTemplate]);
    }
    setIsModalVisible(false);
  };

  const renderItem = ({ item }: { item: MessageTemplate }) => (
    <Card 
      style={styles.templateCard} 
      variant="outlined"
      onPress={item.isSystem ? undefined : () => handleEditPress(item)}
    >
      <View style={styles.templateHeader}>
        <View style={styles.templateTitleContainer}>
          <MessageSquare size={16} color={theme.colors.primary.main} style={{ marginRight: 8 }} />
          <Text style={[styles.templateTitle, { color: theme.colors.textPrimary }]}>
            {item.title}
          </Text>
          {item.isSystem && (
            <View style={[styles.systemBadge, { backgroundColor: theme.colors.divider }]}>
              <Text style={[styles.systemBadgeText, { color: theme.colors.textSecondary }]}>SISTEM</Text>
            </View>
          )}
        </View>
        {!item.isSystem && (
          <TouchableOpacity onPress={() => handleDeletePress(item.id)}>
            <Trash2 size={18} color={theme.colors.secondary.error} />
          </TouchableOpacity>
        )}
      </View>
      <Text style={[styles.templateContent, { color: theme.colors.textSecondary }]} numberOfLines={3}>
        {item.content}
      </Text>
    </Card>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Template-uri mesaje</Text>
        <TouchableOpacity onPress={handleAddPress} style={styles.addButton}>
          <Plus size={24} color={theme.colors.primary.main} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.infoSection}>
          <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
            Creează mesaje predefinite pentru a răspunde mai rapid proprietarilor și pentru a economisi timp.
          </Text>
        </View>

        <FlatList
          data={templates}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          scrollEnabled={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={{ color: theme.colors.textTertiary }}>Nu ai niciun template personalizat.</Text>
            </View>
          }
        />
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal
        visible={isModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>
                {editingTemplate ? 'Editează Template' : 'Template Nou'}
              </Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                <Text style={{ color: theme.colors.textSecondary }}>Închide</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <Input
                label="Titlu (pentru tine)"
                placeholder="Ex: Cerere detalii"
                value={newTitle}
                onChangeText={setNewTitle}
                containerStyle={{ marginBottom: 20 }}
              />
              <Input
                label="Continut Mesaj"
                placeholder="Scrie mesajul care va fi trimis..."
                value={newContent}
                onChangeText={setNewContent}
                multiline
                numberOfLines={5}
                inputStyle={{ height: 120, textAlignVertical: 'top' }}
                containerStyle={{ marginBottom: 30 }}
              />
              
              <Button
                title={editingTemplate ? "Salvează Modificările" : "Creează Template"}
                onPress={handleSave}
                disabled={!newTitle || !newContent}
                fullWidth
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  addButton: {
    padding: 4,
  },
  scrollContent: {
    padding: 16,
  },
  infoSection: {
    marginBottom: 24,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
  templateCard: {
    padding: 16,
    marginBottom: 16,
  },
  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  templateTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  templateTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  systemBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  systemBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  templateContent: {
    fontSize: 14,
    lineHeight: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalContent: {
    marginBottom: 20,
  },
});

export default TemplatesScreen;
