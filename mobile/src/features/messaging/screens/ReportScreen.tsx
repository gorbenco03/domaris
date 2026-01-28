/**
 * IMOBI - Report Screen
 * Report a user or conversation for inappropriate behavior
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AlertTriangle, ShieldCheck } from 'lucide-react-native';

import { useTheme } from '@/app/providers/ThemeProvider';
import { MessagesStackParamList } from '@/app/navigation/types';
import Button from '@/shared/components/Button';
import Input from '@/shared/components/Input';
import { ScreenHeader } from '@/shared/components';

// ============================================
// TYPES
// ============================================

type ReportRouteProp = RouteProp<MessagesStackParamList, 'Report'>;
type NavigationProp = NativeStackNavigationProp<MessagesStackParamList, 'Report'>;

const REPORT_REASONS = [
  'Spam sau mesaje comerciale',
  'Comportament hărțuitor sau abuziv',
  'Limbaj licențios',
  'Tentativă de fraudă / Scam',
  'Proprietate fictivă sau informații false',
  'Alt motiv',
];

// ============================================
// COMPONENT
// ============================================

const ReportScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ReportRouteProp>();
  const { userName } = route.params;

  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [details, setDetails] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!selectedReason) return;
    
    // Logic for submitting report would go here
    setIsSubmitted(true);
    
    // Simulate navigation back after delay
    setTimeout(() => {
      navigation.goBack();
      Alert.alert(
        'Raport trimis',
        'Îți mulțumim pentru sesizare. Echipa noastră de moderare va analiza conversația în cel mai scurt timp.'
      );
    }, 1500);
  };

  if (isSubmitted) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.successContainer}>
          <View style={[styles.successIcon, { backgroundColor: `${theme.colors.accent.main}15` }]}>
            <ShieldCheck size={64} color={theme.colors.accent.main} />
          </View>
          <Text style={[styles.successTitle, { color: theme.colors.textPrimary }]}>Raport înregistrat</Text>
          <Text style={[styles.successDescription, { color: theme.colors.textSecondary }]}>
            Moderatorii noștri vor analiza conversația cu {userName} și vor lua măsurile necesare.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader title="Raportează Utilizator" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.warningBox, { backgroundColor: theme.colors.secondary.warning + '15' }]}>
          <AlertTriangle size={24} color={theme.colors.secondary.warning} />
          <View style={styles.warningTextContainer}>
            <Text style={[styles.warningTitle, { color: theme.colors.textPrimary }]}>Siguranța ta e prioritară</Text>
            <Text style={[styles.warningDescription, { color: theme.colors.textSecondary }]}>
              Dacă te simți în pericol sau suspectezi o fraudă, te rugăm să raportezi imediat. Analizăm fiecare sesizare manual.
            </Text>
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: theme.colors.textPrimary }]}>
          Care este motivul raportării pentru {userName}?
        </Text>

        <View style={styles.reasonsContainer}>
          {REPORT_REASONS.map((reason) => {
            const isSelected = selectedReason === reason;
            return (
              <TouchableOpacity
                key={reason}
                style={[
                  styles.reasonItem,
                  { 
                    backgroundColor: isSelected ? `${theme.colors.primary.main}10` : theme.colors.surface,
                    borderColor: isSelected ? theme.colors.primary.main : theme.colors.border,
                  }
                ]}
                onPress={() => setSelectedReason(reason)}
              >
                <Text style={[
                  styles.reasonText, 
                  { color: isSelected ? theme.colors.primary.main : theme.colors.textPrimary }
                ]}>
                  {reason}
                </Text>
                <View style={[
                  styles.radio, 
                  { borderColor: isSelected ? theme.colors.primary.main : theme.colors.border }
                ]}>
                  {isSelected && <View style={[styles.radioInner, { backgroundColor: theme.colors.primary.main }]} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <Input
          label="Detalii suplimentare (opțional)"
          placeholder="Explică pe scurt ce s-a întâmplat..."
          value={details}
          onChangeText={setDetails}
          multiline
          numberOfLines={4}
          inputStyle={{ height: 100, textAlignVertical: 'top' }}
          containerStyle={{ marginTop: 10, marginBottom: 30 }}
        />

        <Button
          title="Trimite Raportul"
          onPress={handleSubmit}
          variant="primary"
          disabled={!selectedReason}
          fullWidth
          style={{ marginBottom: 40 }}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  warningBox: {
    flexDirection: 'row',
    // backgroundColor applied dynamically with theme.colors.secondary.warning + '15'
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    alignItems: 'flex-start',
  },
  warningTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  warningDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  reasonsContainer: {
    marginBottom: 20,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  reasonText: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
    marginRight: 12,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  successIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  successDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default ReportScreen;
