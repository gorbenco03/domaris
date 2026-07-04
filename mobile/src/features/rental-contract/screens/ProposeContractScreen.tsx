/**
 * RIVA - Propose Contract Screen
 * Permite proprietarului să propună un contract de închiriere după vizionare
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft, FileText, Calendar, DollarSign, Info } from 'lucide-react-native';
import { useTheme } from '@/app/providers/ThemeProvider';
import { Button } from '@/shared/components';
import { ProfileStackParamList } from '@/app/navigation/types';
import { useProposeContract } from '../hooks/useContracts';

type ProposeContractRouteProp = RouteProp<ProfileStackParamList, 'ProposeContract'>;
type ProposeContractNavigationProp = NativeStackNavigationProp<ProfileStackParamList, 'ProposeContract'>;

const ProposeContractScreen: React.FC = () => {
  const navigation = useNavigation<ProposeContractNavigationProp>();
  const route = useRoute<ProposeContractRouteProp>();
  const { theme } = useTheme();
  const { viewingId } = route.params;

  const proposeMutation = useProposeContract();

  const [monthlyRent, setMonthlyRent] = useState('');
  const [deposit, setDeposit] = useState('');
  const [currency, setCurrency] = useState('EUR');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [terms, setTerms] = useState('');

  const validateDate = (val: string) =>
    /^\d{4}-\d{2}-\d{2}$/.test(val);

  const handleSubmit = () => {
    const rent = parseFloat(monthlyRent);
    const dep = parseFloat(deposit);

    if (!monthlyRent || isNaN(rent) || rent <= 0) {
      Alert.alert('Eroare', 'Introduceți o chirie lunară validă (număr pozitiv).');
      return;
    }
    if (deposit === '' || isNaN(dep) || dep < 0) {
      Alert.alert('Eroare', 'Introduceți un depozit valid (0 sau mai mare).');
      return;
    }
    if (!validateDate(startDate)) {
      Alert.alert('Eroare', 'Data de început trebuie să fie în formatul YYYY-MM-DD.');
      return;
    }
    if (!validateDate(endDate)) {
      Alert.alert('Eroare', 'Data de sfârșit trebuie să fie în formatul YYYY-MM-DD.');
      return;
    }
    if (endDate <= startDate) {
      Alert.alert('Eroare', 'Data de sfârșit trebuie să fie după data de început.');
      return;
    }

    proposeMutation.mutate(
      {
        viewingId: Number(viewingId),
        payload: {
          monthlyRent: rent,
          deposit: dep,
          currency: currency || undefined,
          startDate,
          endDate,
          terms: terms || undefined,
        },
      },
      {
        onSuccess: (contract) => {
          Alert.alert('Succes', 'Contractul a fost propus cu succes.', [
            {
              text: 'Vedere contract',
              onPress: () =>
                navigation.replace('ContractDetail', { contractId: contract.id }),
            },
          ]);
        },
        onError: (error: any) => {
          Alert.alert(
            'Eroare',
            error?.response?.data?.message || 'Nu s-a putut propune contractul.'
          );
        },
      }
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[
            styles.backButton,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
          ]}
        >
          <ArrowLeft size={22} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>
          Propune contract
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Info Banner */}
          <View
            style={[
              styles.infoBanner,
              { backgroundColor: theme.colors.primary.main + '15', borderColor: theme.colors.primary.main + '30' },
            ]}
          >
            <Info size={18} color={theme.colors.primary.main} />
            <Text style={[styles.infoText, { color: theme.colors.primary.main }]}>
              Chiriașul va putea accepta și semna contractul digital după propunere.
            </Text>
          </View>

          {/* Secțiunea financiară */}
          <View
            style={[
              styles.section,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
            ]}
          >
            <View style={styles.sectionHeader}>
              <DollarSign size={18} color={theme.colors.accent.main} />
              <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                Termeni financiari
              </Text>
            </View>

            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
              Chirie lunară *
            </Text>
            <View
              style={[
                styles.inputRow,
                { borderColor: theme.colors.border, backgroundColor: theme.colors.background },
              ]}
            >
              <TextInput
                style={[styles.input, { color: theme.colors.textPrimary, flex: 1 }]}
                placeholder="Ex: 500"
                placeholderTextColor={theme.colors.textTertiary}
                keyboardType="numeric"
                value={monthlyRent}
                onChangeText={setMonthlyRent}
              />
              <TouchableOpacity
                onPress={() => setCurrency(currency === 'EUR' ? 'MDL' : 'EUR')}
                style={[styles.currencyBadge, { backgroundColor: theme.colors.primary.main }]}
              >
                <Text style={styles.currencyText}>{currency}</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
              Depozit *
            </Text>
            <TextInput
              style={[
                styles.textInput,
                { color: theme.colors.textPrimary, borderColor: theme.colors.border, backgroundColor: theme.colors.background },
              ]}
              placeholder="Ex: 1000"
              placeholderTextColor={theme.colors.textTertiary}
              keyboardType="numeric"
              value={deposit}
              onChangeText={setDeposit}
            />
          </View>

          {/* Secțiunea perioadă */}
          <View
            style={[
              styles.section,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
            ]}
          >
            <View style={styles.sectionHeader}>
              <Calendar size={18} color={theme.colors.accent.main} />
              <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                Perioada contractului
              </Text>
            </View>

            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
              Data de început * (YYYY-MM-DD)
            </Text>
            <TextInput
              style={[
                styles.textInput,
                { color: theme.colors.textPrimary, borderColor: theme.colors.border, backgroundColor: theme.colors.background },
              ]}
              placeholder="Ex: 2025-08-01"
              placeholderTextColor={theme.colors.textTertiary}
              value={startDate}
              onChangeText={setStartDate}
              autoCapitalize="none"
            />

            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
              Data de sfârșit * (YYYY-MM-DD)
            </Text>
            <TextInput
              style={[
                styles.textInput,
                { color: theme.colors.textPrimary, borderColor: theme.colors.border, backgroundColor: theme.colors.background },
              ]}
              placeholder="Ex: 2026-08-01"
              placeholderTextColor={theme.colors.textTertiary}
              value={endDate}
              onChangeText={setEndDate}
              autoCapitalize="none"
            />
          </View>

          {/* Secțiunea clauze */}
          <View
            style={[
              styles.section,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
            ]}
          >
            <View style={styles.sectionHeader}>
              <FileText size={18} color={theme.colors.accent.main} />
              <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                Clauze suplimentare
              </Text>
            </View>

            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
              Termeni și condiții (opțional)
            </Text>
            <TextInput
              style={[
                styles.textArea,
                { color: theme.colors.textPrimary, borderColor: theme.colors.border, backgroundColor: theme.colors.background },
              ]}
              placeholder="Introduceți clauze suplimentare, reguli, etc."
              placeholderTextColor={theme.colors.textTertiary}
              multiline
              numberOfLines={5}
              value={terms}
              onChangeText={setTerms}
              textAlignVertical="top"
            />
          </View>

          {/* Buton */}
          <Button
            title={proposeMutation.isPending ? 'Se trimite...' : 'Propune contractul'}
            onPress={handleSubmit}
            variant="primary"
            fullWidth
            disabled={proposeMutation.isPending}
            loading={proposeMutation.isPending}
            style={styles.submitButton}
          />
        </ScrollView>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '500',
  },
  section: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
    marginTop: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 12,
    overflow: 'hidden',
  },
  input: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  currencyBadge: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    alignSelf: 'stretch',
    justifyContent: 'center',
  },
  currencyText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 12,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    minHeight: 120,
  },
  submitButton: {
    marginTop: 8,
  },
});

export default ProposeContractScreen;
