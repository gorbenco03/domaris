/**
 * RIVA - My Contracts Screen
 * Lista contractelor utilizatorului (ca proprietar sau chiriaș)
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft, FileText, ChevronRight } from 'lucide-react-native';
import { useTheme } from '@/app/providers/ThemeProvider';
import { Button } from '@/shared/components';
import { ProfileStackParamList } from '@/app/navigation/types';
import { useMyContracts } from '../hooks/useContracts';
import { RentalContract, CONTRACT_STATUS_INFO, ContractStatus } from '../types';

type MyContractsNavigationProp = NativeStackNavigationProp<ProfileStackParamList, 'MyContracts'>;

const MyContractsScreen: React.FC = () => {
  const navigation = useNavigation<MyContractsNavigationProp>();
  const { theme } = useTheme();
  const { data: contracts, isLoading, error, refetch } = useMyContracts();

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('ro-RO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  const formatPrice = (price: number, currency = 'EUR') =>
    new Intl.NumberFormat('ro-RO', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(price);

  const renderItem = ({ item }: { item: RentalContract }) => {
    const statusInfo = CONTRACT_STATUS_INFO[item.status as ContractStatus] ?? {
      label: item.status,
      color: '#94a3b8',
    };
    const roleLabel = item.isOwner ? 'Proprietar' : 'Chiriaș';

    return (
      <TouchableOpacity
        style={[
          styles.card,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
        ]}
        onPress={() =>
          navigation.push('ContractDetail', { contractId: item.id })
        }
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.iconWrapper, { backgroundColor: theme.colors.primary.main + '15' }]}>
            <FileText size={20} color={theme.colors.primary.main} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text
              style={[styles.cardTitle, { color: theme.colors.textPrimary }]}
              numberOfLines={1}
            >
              {item.listing?.title ?? `Contract #${item.id}`}
            </Text>
            <Text style={[styles.cardRole, { color: theme.colors.textSecondary }]}>
              {roleLabel}
            </Text>
          </View>
          <ChevronRight size={18} color={theme.colors.textTertiary} />
        </View>

        <View style={[styles.divider, { backgroundColor: theme.colors.divider }]} />

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>
              Chirie lunară
            </Text>
            <Text style={[styles.infoValue, { color: theme.colors.textPrimary }]}>
              {formatPrice(item.monthlyRent, item.currency)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>
              Perioadă
            </Text>
            <Text style={[styles.infoValue, { color: theme.colors.textPrimary }]}>
              {formatDate(item.startDate)} – {formatDate(item.endDate)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>
              Status
            </Text>
            <View
              style={[
                styles.statusChip,
                { backgroundColor: statusInfo.color + '20' },
              ]}
            >
              <Text style={[styles.statusLabel, { color: statusInfo.color }]}>
                {statusInfo.label}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <FileText size={56} color={theme.colors.textTertiary} />
      <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>
        Niciun contract
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
        Nu ai niciun contract de închiriere momentan.
      </Text>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
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
          Contractele mele
        </Text>
        <View style={{ width: 44 }} />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary.main} />
        </View>
      ) : error ? (
        <View style={styles.loadingContainer}>
          <Text style={[styles.emptySubtitle, { color: theme.colors.secondary.error, marginBottom: 16 }]}>
            Eroare la încărcarea contractelor
          </Text>
          <Button title="Încearcă din nou" onPress={() => refetch()} variant="outline" />
        </View>
      ) : (
        <FlatList
          data={contracts ?? []}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={[
            styles.listContent,
            (!contracts || contracts.length === 0) && styles.listContentEmpty,
          ]}
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: 16,
  },
  listContentEmpty: {
    flex: 1,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  cardRole: {
    fontSize: 12,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    marginHorizontal: 16,
  },
  cardBody: {
    padding: 16,
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 13,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '500',
  },
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default MyContractsScreen;
