/**
 * IMOBI - User Type Selection Screen
 * Choose between Property Owner and Property Seeker
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '@/app/navigation/types';
import { useTheme } from '@/app/providers/ThemeProvider';
import { useAuth } from '@/app/providers/AuthProvider';
import { Button } from '@/shared/components';
import { ArrowLeft, Home, Search, Check, Building2, MapPin } from 'lucide-react-native';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'UserTypeSelection'>;
type UserType = 'OWNER' | 'SEEKER' | null;

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 24 * 2 - 16) / 2;

const UserTypeSelectionScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const { register } = useAuth();
  const [selectedType, setSelectedType] = useState<UserType>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = async () => {
    if (!selectedType) return;
    setIsLoading(true);
    
    try {
      // Mock registration call
      // In a real app, you would pass data from previous steps
      await register({
        email: 'demo@example.com',
        password: 'Password123!',
        firstName: 'Utilizator',
        lastName: 'Demo',
        userType: selectedType === 'OWNER' ? 'owner' : 'seeker',
      });
    } catch (error) {
      console.error('Registration error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const userTypes = [
    {
      type: 'OWNER' as UserType,
      title: 'Proprietar',
      description: 'Vreau să listez și să vând/închiriez proprietăți',
      icon: Building2,
      gradient: [theme.colors.primary.main, theme.colors.primary.light] as [string, string],
      features: ['Publică anunțuri', 'Gestionează proprietăți', 'Analiză AI', 'Programări vizualizări'],
    },
    {
      type: 'SEEKER' as UserType,
      title: 'Căutător',
      description: 'Caut o proprietate de cumpărat sau închiriat',
      icon: Search,
      gradient: [theme.colors.accent.dark, theme.colors.accent.main] as [string, string],
      features: ['Căutare inteligentă', 'Salvează favorite', 'Compară proprietăți', 'Asistent AI'],
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButton, { backgroundColor: theme.colors.surface }]}>
          <ArrowLeft size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.progressContainer}>
          <View style={[styles.progressStep, { backgroundColor: theme.colors.accent.main }]} />
          <View style={[styles.progressStep, { backgroundColor: theme.colors.accent.main }]} />
          <View style={[styles.progressStep, { backgroundColor: theme.colors.accent.main }]} />
        </View>
      </View>

      <View style={styles.content}>
        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Ce te aduce aici? 🏠</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>Alege tipul de cont pentru o experiență personalizată</Text>
        </View>

        {/* User Type Cards */}
        <View style={styles.cardsContainer}>
          {userTypes.map((item) => {
            const isSelected = selectedType === item.type;
            const IconComponent = item.icon;
            
            return (
              <TouchableOpacity key={item.type} onPress={() => setSelectedType(item.type)} activeOpacity={0.9} style={styles.cardWrapper}>
                <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: isSelected ? theme.colors.accent.main : theme.colors.border, borderWidth: isSelected ? 2 : 1 }]}>
                  {/* Gradient Header */}
                  <LinearGradient colors={item.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cardHeader}>
                    <IconComponent size={32} color="#ffffff" />
                    {isSelected && (
                      <View style={styles.checkBadge}>
                        <Check size={14} color="#ffffff" strokeWidth={3} />
                      </View>
                    )}
                  </LinearGradient>

                  {/* Content */}
                  <View style={styles.cardContent}>
                    <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>{item.title}</Text>
                    <Text style={[styles.cardDescription, { color: theme.colors.textSecondary }]}>{item.description}</Text>

                    {/* Features */}
                    <View style={styles.featuresContainer}>
                      {item.features.map((feature, idx) => (
                        <View key={idx} style={styles.featureItem}>
                          <Check size={12} color={theme.colors.accent.main} />
                          <Text style={[styles.featureText, { color: theme.colors.textSecondary }]}>{feature}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Note */}
        <View style={[styles.noteContainer, { backgroundColor: `${theme.colors.secondary.info}10` }]}>
          <MapPin size={16} color={theme.colors.secondary.info} />
          <Text style={[styles.noteText, { color: theme.colors.textSecondary }]}>Poți schimba oricând tipul de cont din setări</Text>
        </View>

        <View style={styles.spacer} />

        {/* Continue Button */}
        <Button title="Continuă" onPress={handleContinue} disabled={!selectedType} loading={isLoading} fullWidth style={styles.continueButton} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingTop: 8, marginBottom: 24 },
  backButton: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  progressContainer: { flex: 1, flexDirection: 'row', justifyContent: 'center', gap: 8, marginRight: 44 },
  progressStep: { width: 32, height: 4, borderRadius: 2 },
  content: { flex: 1, paddingHorizontal: 24 },
  titleContainer: { marginBottom: 24 },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 8 },
  subtitle: { fontSize: 16, lineHeight: 22 },
  cardsContainer: { flexDirection: 'row', gap: 16 },
  cardWrapper: { flex: 1 },
  card: { borderRadius: 16, overflow: 'hidden' },
  cardHeader: { height: 80, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  checkBadge: { position: 'absolute', top: 12, right: 12, width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center' },
  cardContent: { padding: 16 },
  cardTitle: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  cardDescription: { fontSize: 13, lineHeight: 18, marginBottom: 12 },
  featuresContainer: { gap: 6 },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  featureText: { fontSize: 12 },
  noteContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12, marginTop: 24 },
  noteText: { fontSize: 13, flex: 1 },
  spacer: { flex: 1, minHeight: 24 },
  continueButton: { marginBottom: 24 },
});

export default UserTypeSelectionScreen;
