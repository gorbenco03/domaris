/**
 * IMOBI - Identity Verification Screen (Level 2)
 */

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FileText, ShieldCheck } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';

import { useTheme } from '@/app/providers/ThemeProvider';
import { Button, Card, Chip, ProgressBar, ScreenHeader } from '@/shared/components';
import { useKycStatus, useStartIdVerification } from '@/features/kyc/hooks/useKyc';

type UploadFile = { uri: string; name: string; type: string };

const IdentityVerificationScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const { data: kycStatus } = useKycStatus();
  const startVerification = useStartIdVerification();

  const [docType, setDocType] = useState<'ID_CARD' | 'PASSPORT' | 'DRIVING_LICENSE' | null>(null);
  const [docFront, setDocFront] = useState<UploadFile | null>(null);
  const [docBack, setDocBack] = useState<UploadFile | null>(null);
  const [selfie, setSelfie] = useState<UploadFile | null>(null);

  const status = kycStatus?.status ?? 'NOT_STARTED';
  const isPending = kycStatus?.targetLevel === 2 && ['PENDING', 'IN_REVIEW'].includes(status);
  const isVerified = (kycStatus?.currentLevel ?? 0) >= 2;
  const canResubmit = status === 'REJECTED';
  const rejectionReason = kycStatus?.rejectionReason ?? null;
  const isReady = !!docType && !!docFront && !!selfie && !isPending && !isVerified;

  const docTypes = useMemo(
    () => [
      { value: 'ID_CARD' as const, label: 'Carte identitate' },
      { value: 'PASSPORT' as const, label: 'Pașaport' },
      { value: 'DRIVING_LICENSE' as const, label: 'Permis auto' },
    ],
    []
  );

  const buildFile = (uri: string, fallbackName: string): UploadFile => {
    const filename = uri.split('/').pop() || fallbackName;
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';
    return { uri, name: filename, type };
  };

  const pickFromLibrary = async (setter: (file: UploadFile | null) => void) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted && permission.status !== 'limited') {
      Alert.alert('Permisiune necesară', 'Avem nevoie de acces la galerie.');
      return;
    }

    const mediaTypes =
      (ImagePicker as any).MediaTypeOptions?.Images ??
      (ImagePicker as any).MediaType?.Images;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes,
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setter(buildFile(result.assets[0].uri, 'document.jpg'));
    }
  };

  const takePhoto = async (setter: (file: UploadFile | null) => void) => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permisiune necesară', 'Avem nevoie de acces la cameră.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setter(buildFile(result.assets[0].uri, 'camera.jpg'));
    }
  };

  const handleSubmit = async () => {
    if (isPending) {
      Alert.alert('În curs', 'Ai deja o verificare în curs.');
      return;
    }

    if (!docType || !docFront || !selfie) {
      Alert.alert('Date incomplete', 'Selectează tipul și încarcă documentele obligatorii.');
      return;
    }

    try {
      await startVerification.mutateAsync({
        docType,
        docFront,
        docBack: docBack ?? undefined,
        selfie,
      });
      Alert.alert('Succes', 'Documentele au fost trimise pentru verificare.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('KYC submit error', error);
      Alert.alert('Eroare', 'Nu am putut trimite documentele.');
    }
  };

  const renderUploadCard = (
    title: string,
    file: UploadFile | null,
    onPick: () => void,
    onCamera: () => void,
    onRemove: () => void,
    hint?: string
  ) => (
    <Card variant="outlined" style={styles.uploadCard}>
      <View style={styles.cardHeader}>
        <FileText size={18} color={theme.colors.primary.main} />
        <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>
          {title}
        </Text>
      </View>
      {hint && (
        <Text style={[styles.cardHint, { color: theme.colors.textSecondary }]}>
          {hint}
        </Text>
      )}
      {file ? (
        <View style={styles.previewRow}>
          <Image source={{ uri: file.uri }} style={styles.previewImage} />
          <View style={styles.previewActions}>
            <Text style={[styles.previewText, { color: theme.colors.textSecondary }]}>
              {file.name}
            </Text>
            <TouchableOpacity onPress={onRemove}>
              <Text style={[styles.removeText, { color: theme.colors.secondary.error }]}>
                Elimină
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.uploadActions}>
          <Button
            title="Galerie"
            variant="secondary"
            onPress={onPick}
            style={styles.actionButton}
          />
          <Button
            title="Cameră"
            variant="secondary"
            onPress={onCamera}
            style={styles.actionButton}
          />
        </View>
      )}
    </Card>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <ScreenHeader title="Verificare Identitate" />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card variant="outlined" style={styles.infoCard}>
          <View style={styles.infoRow}>
            <ShieldCheck size={20} color={theme.colors.accent.main} />
            <Text style={[styles.infoTitle, { color: theme.colors.textPrimary }]}>
              Nivel 2 - Identitate Verificată
            </Text>
          </View>
          <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
            După verificare vei putea trimite mesaje și cere vizionări.
          </Text>
          <View style={styles.progressWrapper}>
            <ProgressBar currentStep={2} totalSteps={3} showPercentage={false} />
          </View>
        </Card>

        {isPending && (
          <Card variant="outlined" style={styles.statusCard}>
            <View style={styles.infoRow}>
              <ActivityIndicator color={theme.colors.secondary.warning} />
              <Text style={[styles.infoTitle, { color: theme.colors.textPrimary }]}>
                Verificare în curs
              </Text>
            </View>
            <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
              Documentele tale sunt în verificare. Te notificăm când este gata.
            </Text>
          </Card>
        )}

        {!isPending && canResubmit && rejectionReason && (
          <Card variant="outlined" style={styles.statusCard}>
            <View style={styles.infoRow}>
              <ShieldCheck size={18} color={theme.colors.secondary.error} />
              <Text style={[styles.infoTitle, { color: theme.colors.textPrimary }]}>
                Verificare respinsă
              </Text>
            </View>
            <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
              {rejectionReason}
            </Text>
          </Card>
        )}

        {isVerified && (
          <Card variant="outlined" style={styles.statusCard}>
            <View style={styles.infoRow}>
              <ShieldCheck size={18} color={theme.colors.accent.main} />
              <Text style={[styles.infoTitle, { color: theme.colors.textPrimary }]}>
                Identitate verificată
              </Text>
            </View>
            <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
              Nivelul 2 este activ. Nu mai trebuie să retrimiți documente.
            </Text>
          </Card>
        )}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
            Tip document
          </Text>
          <View style={styles.chipsRow}>
            {docTypes.map((item) => (
              <Chip
                key={item.value}
                label={item.label}
                selected={docType === item.value}
                onPress={() => setDocType(item.value)}
                variant="filter"
                size="sm"
                style={styles.chip}
              />
            ))}
          </View>
          <Text style={[styles.helperText, { color: theme.colors.textSecondary }]}>
            Selectează documentul pe care îl vei încărca.
          </Text>
        </View>

        {renderUploadCard(
          'Fața documentului',
          docFront,
          () => pickFromLibrary(setDocFront),
          () => takePhoto(setDocFront),
          () => setDocFront(null),
          'Clar, fără reflexii sau tăieturi.'
        )}

        {renderUploadCard(
          'Verso (opțional)',
          docBack,
          () => pickFromLibrary(setDocBack),
          () => takePhoto(setDocBack),
          () => setDocBack(null),
          'Dacă documentul are informații pe spate.'
        )}

        {renderUploadCard(
          'Selfie cu documentul',
          selfie,
          () => pickFromLibrary(setSelfie),
          () => takePhoto(setSelfie),
          () => setSelfie(null),
          'Fața vizibilă, documentul în cadru.'
        )}

        <Button
          title={canResubmit ? 'Retrimite pentru verificare' : 'Trimite pentru verificare'}
          onPress={handleSubmit}
          disabled={!isReady}
          loading={startVerification.isPending}
          fullWidth
          style={{ marginTop: theme.spacing[6] }}
        />
        {!isReady && (
          <Text style={[styles.footerHint, { color: theme.colors.textTertiary }]}>
            Completează toate câmpurile obligatorii pentru a continua.
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  infoCard: { padding: 16, marginBottom: 16 },
  statusCard: { padding: 16, marginBottom: 16 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  infoTitle: { fontWeight: '600' },
  infoText: { lineHeight: 20 },
  progressWrapper: { marginTop: 12 },
  section: { marginBottom: 16 },
  sectionTitle: { fontWeight: '600', marginBottom: 8 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { marginBottom: 8 },
  helperText: { marginTop: 6, lineHeight: 18 },
  uploadCard: { padding: 16, marginBottom: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  cardTitle: { fontWeight: '600' },
  cardHint: { marginBottom: 12, lineHeight: 20 },
  uploadActions: { flexDirection: 'row', gap: 8 },
  actionButton: { flex: 1 },
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  previewImage: { width: 64, height: 64, borderRadius: 8 },
  previewActions: { flex: 1 },
  previewText: { marginBottom: 6 },
  removeText: { fontWeight: '600' },
  footerHint: { marginTop: 8, textAlign: 'center' },
});

export default IdentityVerificationScreen;
