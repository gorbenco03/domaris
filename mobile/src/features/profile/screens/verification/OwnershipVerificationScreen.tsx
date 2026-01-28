/**
 * IMOBI - Ownership Verification Screen (Level 3)
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
import { useKycStatus, useUploadPropertyDocument } from '@/features/kyc/hooks/useKyc';

type UploadFile = { uri: string; name: string; type: string };

const OwnershipVerificationScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const { data: kycStatus } = useKycStatus();
  const uploadDocument = useUploadPropertyDocument();

  const [docType, setDocType] = useState<'PROPERTY_DEED' | 'UTILITY_BILL' | 'OTHER' | null>(null);
  const [documentFile, setDocumentFile] = useState<UploadFile | null>(null);

  const status = kycStatus?.status ?? 'NOT_STARTED';
  const isPending = kycStatus?.targetLevel === 3 && ['PENDING', 'IN_REVIEW'].includes(status);
  const isVerified = (kycStatus?.currentLevel ?? 0) >= 3;
  const canResubmit = status === 'REJECTED';
  const rejectionReason = kycStatus?.rejectionReason ?? null;
  const isReady = !!docType && !!documentFile && !isPending && !isVerified;

  const docTypes = useMemo(
    () => [
      { value: 'PROPERTY_DEED' as const, label: 'Act proprietate' },
      { value: 'UTILITY_BILL' as const, label: 'Factură utilități' },
      { value: 'OTHER' as const, label: 'Alt document' },
    ],
    []
  );

  const buildFile = (uri: string, fallbackName: string): UploadFile => {
    const filename = uri.split('/').pop() || fallbackName;
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';
    return { uri, name: filename, type };
  };

  const pickFromLibrary = async () => {
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
      setDocumentFile(buildFile(result.assets[0].uri, 'document.jpg'));
    }
  };

  const handleSubmit = async () => {
    if (isPending) {
      Alert.alert('În curs', 'Ai deja o verificare în curs.');
      return;
    }

    if (!docType || !documentFile) {
      Alert.alert('Date incomplete', 'Alege tipul documentului și încarcă fișierul.');
      return;
    }

    try {
      await uploadDocument.mutateAsync({
        docType,
        file: documentFile,
      });
      Alert.alert('Succes', 'Documentul a fost trimis pentru verificare.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('KYC ownership error', error);
      Alert.alert('Eroare', 'Nu am putut trimite documentul.');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <ScreenHeader title="Verificare Proprietar" />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card variant="outlined" style={styles.infoCard}>
          <View style={styles.infoRow}>
            <ShieldCheck size={20} color={theme.colors.accent.main} />
            <Text style={[styles.infoTitle, { color: theme.colors.textPrimary }]}>
              Nivel 3 - Proprietar Verificat
            </Text>
          </View>
          <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
            După verificare vei putea publica anunțuri.
          </Text>
          <View style={styles.progressWrapper}>
            <ProgressBar currentStep={3} totalSteps={3} showPercentage={false} />
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
                Proprietar verificat
              </Text>
            </View>
            <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
              Nivelul 3 este activ. Poți posta anunțuri.
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
            Selectează documentul care dovedește proprietatea.
          </Text>
        </View>

        <Card variant="outlined" style={styles.uploadCard}>
          <View style={styles.cardHeader}>
            <FileText size={18} color={theme.colors.primary.main} />
            <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>
              Document proprietate
            </Text>
          </View>
          {documentFile ? (
            <View style={styles.previewRow}>
              <Image source={{ uri: documentFile.uri }} style={styles.previewImage} />
              <View style={styles.previewActions}>
                <Text style={[styles.previewText, { color: theme.colors.textSecondary }]}>
                  {documentFile.name}
                </Text>
                <TouchableOpacity onPress={() => setDocumentFile(null)}>
                  <Text style={[styles.removeText, { color: theme.colors.secondary.error }]}>
                    Elimină
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <Button
              title="Încarcă document"
              variant="secondary"
              onPress={pickFromLibrary}
            />
          )}
        </Card>

        <Button
          title={canResubmit ? 'Retrimite pentru verificare' : 'Trimite pentru verificare'}
          onPress={handleSubmit}
          disabled={!isReady}
          loading={uploadDocument.isPending}
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
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  previewImage: { width: 64, height: 64, borderRadius: 8 },
  previewActions: { flex: 1 },
  previewText: { marginBottom: 6 },
  removeText: { fontWeight: '600' },
  footerHint: { marginTop: 8, textAlign: 'center' },
});

export default OwnershipVerificationScreen;
