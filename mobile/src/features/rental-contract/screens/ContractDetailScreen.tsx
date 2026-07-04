/**
 * RIVA - Contract Detail Screen
 * Afișează termenii contractului și acțiunile disponibile după rol:
 * - Chiriaș: Acceptă → Semnează
 * - Proprietar: Semnează (după ce chiriașul acceptă)
 * - Ambii: când status = signed → rezumat „Contract semnat"
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ArrowLeft,
  FileText,
  Calendar,
  DollarSign,
  CheckCircle,
  User,
  Clock,
} from 'lucide-react-native';
import { useTheme } from '@/app/providers/ThemeProvider';
import { Button } from '@/shared/components';
import { ProfileStackParamList } from '@/app/navigation/types';
import { useContract, useAcceptContract, useSignContract } from '../hooks/useContracts';
import { CONTRACT_STATUS_INFO, ContractStatus } from '../types';

type ContractDetailRouteProp = RouteProp<ProfileStackParamList, 'ContractDetail'>;
type ContractDetailNavigationProp = NativeStackNavigationProp<ProfileStackParamList, 'ContractDetail'>;

const ContractDetailScreen: React.FC = () => {
  const navigation = useNavigation<ContractDetailNavigationProp>();
  const route = useRoute<ContractDetailRouteProp>();
  const { theme } = useTheme();
  const { contractId } = route.params;

  const { data: contract, isLoading, error, refetch } = useContract(contractId);
  const acceptMutation = useAcceptContract();
  const signMutation = useSignContract();

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ro-RO', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatPrice = (price: number, currency = 'EUR') =>
    new Intl.NumberFormat('ro-RO', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(price);

  const handleAccept = () => {
    Alert.alert(
      'Acceptare contract',
      'Ești sigur că dorești să accepți termenii contractului?',
      [
        { text: 'Anulează', style: 'cancel' },
        {
          text: 'Acceptă',
          onPress: () => {
            acceptMutation.mutate(contractId, {
              onSuccess: () => {
                Alert.alert('Succes', 'Contractul a fost acceptat. Poți acum să-l semnezi.');
                refetch();
              },
              onError: (err: any) => {
                Alert.alert('Eroare', err?.response?.data?.message || 'Nu s-a putut accepta contractul.');
              },
            });
          },
        },
      ]
    );
  };

  const handleSign = () => {
    Alert.alert(
      'Semnare contract',
      'Prin semnare, confirmi acordul cu toți termenii contractului. Continui?',
      [
        { text: 'Anulează', style: 'cancel' },
        {
          text: 'Semnez',
          onPress: () => {
            signMutation.mutate(contractId, {
              onSuccess: () => {
                Alert.alert('Contract semnat!', 'Semnătura ta a fost înregistrată cu succes.');
                refetch();
              },
              onError: (err: any) => {
                Alert.alert('Eroare', err?.response?.data?.message || 'Nu s-a putut semna contractul.');
              },
            });
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary.main} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !contract) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
        <View style={styles.centered}>
          <Text style={[styles.errorText, { color: theme.colors.secondary.error }]}>
            Eroare la încărcarea contractului
          </Text>
          <Button title="Încearcă din nou" onPress={() => refetch()} variant="outline" />
        </View>
      </SafeAreaView>
    );
  }

  const statusInfo = CONTRACT_STATUS_INFO[contract.status as ContractStatus] ?? {
    label: contract.status,
    color: '#94a3b8',
  };

  const isSigned = contract.status === 'signed';
  const isOwner = contract.isOwner;
  const canAccept = !isOwner && contract.status === 'proposed';
  const canSign = contract.status === 'accepted' && !isSigned;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.background }]}>
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
          Contract de închiriere
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Status Badge */}
        <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '20', borderColor: statusInfo.color + '40' }]}>
          <View style={[styles.statusDot, { backgroundColor: statusInfo.color }]} />
          <Text style={[styles.statusLabel, { color: statusInfo.color }]}>
            {statusInfo.label}
          </Text>
        </View>

        {/* Contract semnat - rezumat special */}
        {isSigned && (
          <View style={[styles.signedBanner, { backgroundColor: '#10b981' + '15', borderColor: '#10b981' + '40' }]}>
            <CheckCircle size={32} color="#10b981" />
            <View style={{ flex: 1 }}>
              <Text style={[styles.signedTitle, { color: '#10b981' }]}>
                Contract semnat
              </Text>
              <Text style={[styles.signedSubtitle, { color: theme.colors.textSecondary }]}>
                Ambele părți au semnat contractul. Acesta este activ.
              </Text>
            </View>
          </View>
        )}

        {/* Termeni financiari */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <View style={styles.sectionHeader}>
            <DollarSign size={18} color={theme.colors.accent.main} />
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
              Termeni financiari
            </Text>
          </View>

          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: theme.colors.textSecondary }]}>Chirie lunară</Text>
            <Text style={[styles.rowValue, { color: theme.colors.textPrimary }]}>
              {formatPrice(contract.monthlyRent, contract.currency)}
            </Text>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.colors.divider }]} />
          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: theme.colors.textSecondary }]}>Depozit</Text>
            <Text style={[styles.rowValue, { color: theme.colors.textPrimary }]}>
              {formatPrice(contract.deposit, contract.currency)}
            </Text>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.colors.divider }]} />
          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: theme.colors.textSecondary }]}>Monedă</Text>
            <Text style={[styles.rowValue, { color: theme.colors.textPrimary }]}>
              {contract.currency}
            </Text>
          </View>
        </View>

        {/* Perioadă */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <View style={styles.sectionHeader}>
            <Calendar size={18} color={theme.colors.accent.main} />
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
              Perioada contractului
            </Text>
          </View>

          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: theme.colors.textSecondary }]}>Data de început</Text>
            <Text style={[styles.rowValue, { color: theme.colors.textPrimary }]}>
              {formatDate(contract.startDate)}
            </Text>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.colors.divider }]} />
          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: theme.colors.textSecondary }]}>Data de sfârșit</Text>
            <Text style={[styles.rowValue, { color: theme.colors.textPrimary }]}>
              {formatDate(contract.endDate)}
            </Text>
          </View>
        </View>

        {/* Clauze */}
        {contract.terms && (
          <View style={[styles.section, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <View style={styles.sectionHeader}>
              <FileText size={18} color={theme.colors.accent.main} />
              <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                Clauze suplimentare
              </Text>
            </View>
            <Text style={[styles.termsText, { color: theme.colors.textSecondary }]}>
              {contract.terms}
            </Text>
          </View>
        )}

        {/* Semnături */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <View style={styles.sectionHeader}>
            <User size={18} color={theme.colors.accent.main} />
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
              Semnături
            </Text>
          </View>

          <View style={styles.signatureRow}>
            <Clock
              size={16}
              color={contract.signedByOwnerAt ? '#10b981' : theme.colors.textTertiary}
            />
            <Text style={[styles.signatureLabel, { color: theme.colors.textSecondary }]}>
              Proprietar:
            </Text>
            <Text style={[
              styles.signatureValue,
              { color: contract.signedByOwnerAt ? '#10b981' : theme.colors.textTertiary },
            ]}>
              {contract.signedByOwnerAt ? `Semnat ${formatDate(contract.signedByOwnerAt)}` : 'Nesemnat'}
            </Text>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.colors.divider }]} />

          <View style={styles.signatureRow}>
            <Clock
              size={16}
              color={contract.signedBySeekerAt ? '#10b981' : theme.colors.textTertiary}
            />
            <Text style={[styles.signatureLabel, { color: theme.colors.textSecondary }]}>
              Chiriaș:
            </Text>
            <Text style={[
              styles.signatureValue,
              { color: contract.signedBySeekerAt ? '#10b981' : theme.colors.textTertiary },
            ]}>
              {contract.signedBySeekerAt ? `Semnat ${formatDate(contract.signedBySeekerAt)}` : 'Nesemnat'}
            </Text>
          </View>
        </View>

        {/* Acțiuni */}
        {canAccept && (
          <Button
            title="Acceptă contractul"
            onPress={handleAccept}
            variant="primary"
            fullWidth
            style={styles.actionButton}
            loading={acceptMutation.isPending}
          />
        )}

        {canSign && (
          <Button
            title="Semnează contractul"
            onPress={handleSign}
            variant="primary"
            fullWidth
            style={styles.actionButton}
            loading={signMutation.isPending}
          />
        )}
      </ScrollView>
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
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  signedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  signedTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  signedSubtitle: {
    fontSize: 13,
    lineHeight: 18,
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  rowLabel: {
    fontSize: 14,
  },
  rowValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginVertical: 4,
  },
  termsText: {
    fontSize: 14,
    lineHeight: 22,
  },
  signatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  signatureLabel: {
    fontSize: 14,
  },
  signatureValue: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  actionButton: {
    marginBottom: 12,
  },
});

export default ContractDetailScreen;
