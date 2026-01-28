"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Shield, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Upload, 
  Camera,
  FileText,
  AlertCircle,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { kycApi, IKycStatus, IdentityDocType, PropertyDocType } from "@/features/kyc/api";

type VerificationStep = 'overview' | 'identity' | 'property';

export default function VerificationPage() {
  const router = useRouter();
  const [step, setStep] = useState<VerificationStep>('overview');
  const [status, setStatus] = useState<IKycStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Identity verification state
  const [docType, setDocType] = useState<IdentityDocType>('ID_CARD');
  const [docFront, setDocFront] = useState<File | null>(null);
  const [docBack, setDocBack] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);

  // Property verification state
  const [propDocType, setPropDocType] = useState<PropertyDocType>('PROPERTY_DEED');
  const [propDoc, setPropDoc] = useState<File | null>(null);

  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);
  const selfieInputRef = useRef<HTMLInputElement>(null);
  const propInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const data = await kycApi.getStatus();
      setStatus(data);
    } catch (err) {
      console.error('Failed to fetch KYC status', err);
    } finally {
      setLoading(false);
    }
  };

  const handleIdentitySubmit = async () => {
    if (!docFront || !selfie) {
      setError("Te rugăm să încarci documentul și selfie-ul");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await kycApi.verifyIdentity(docType, docFront, selfie, docBack || undefined);
      setSuccess("Documentele au fost trimise cu succes! Vei primi un răspuns în 24-48 ore.");
      await fetchStatus();
      setTimeout(() => {
        setStep('overview');
        setSuccess("");
      }, 3000);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || "A apărut o eroare. Te rugăm să încerci din nou.");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePropertySubmit = async () => {
    if (!propDoc) {
      setError("Te rugăm să încarci un document");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await kycApi.uploadPropertyDoc(propDocType, propDoc);
      setSuccess("Documentul a fost trimis cu succes!");
      await fetchStatus();
      setTimeout(() => {
        setStep('overview');
        setSuccess("");
      }, 3000);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || "A apărut o eroare. Te rugăm să încerci din nou.");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'PENDING':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'REJECTED':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-muted-foreground" />;
    }
  };



  const getLevelBadge = (level: number) => {
    const badges = [
      { label: 'Nou', color: 'bg-gray-100 text-gray-800' },
      { label: 'Email Verificat', color: 'bg-blue-100 text-blue-800' },
      { label: 'Identitate Verificată', color: 'bg-green-100 text-green-800' },
      { label: 'Proprietar Verificat', color: 'bg-purple-100 text-purple-800' },
    ];
    return badges[level] || badges[0];
  };

  if (loading) {
    return (
      <div className="container max-w-2xl py-8 px-4">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  // Identity Verification Step
  if (step === 'identity') {
    return (
      <div className="container max-w-2xl py-8 px-4">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => setStep('overview')}
            className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold">Verificare Identitate</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Încarcă documentele</CardTitle>
            <CardDescription>
              Avem nevoie de un document de identitate și un selfie pentru a verifica contul tău.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 bg-green-100 text-green-800 text-sm rounded-lg flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                {success}
              </div>
            )}

            {/* Document Type Selection */}
            <div>
              <label className="text-sm font-medium mb-2 block">Tipul documentului</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'ID_CARD', label: 'Carte de Identitate' },
                  { value: 'PASSPORT', label: 'Pașaport' },
                  { value: 'DRIVING_LICENSE', label: 'Permis Auto' },
                ].map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setDocType(type.value as IdentityDocType)}
                    className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                      docType === type.value
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-muted hover:border-primary/50'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Document Front */}
            <div>
              <label className="text-sm font-medium mb-2 block">Față document</label>
              <input
                ref={frontInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setDocFront(e.target.files?.[0] || null)}
              />
              <button
                onClick={() => frontInputRef.current?.click()}
                className={`w-full p-6 border-2 border-dashed rounded-xl transition-all ${
                  docFront ? 'border-green-500 bg-green-50' : 'border-muted hover:border-primary/50'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  {docFront ? (
                    <>
                      <CheckCircle2 className="w-8 h-8 text-green-600" />
                      <span className="text-sm text-green-700">{docFront.name}</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Încarcă fața documentului</span>
                    </>
                  )}
                </div>
              </button>
            </div>

            {/* Document Back */}
            <div>
              <label className="text-sm font-medium mb-2 block">Spate document (opțional)</label>
              <input
                ref={backInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setDocBack(e.target.files?.[0] || null)}
              />
              <button
                onClick={() => backInputRef.current?.click()}
                className={`w-full p-6 border-2 border-dashed rounded-xl transition-all ${
                  docBack ? 'border-green-500 bg-green-50' : 'border-muted hover:border-primary/50'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  {docBack ? (
                    <>
                      <CheckCircle2 className="w-8 h-8 text-green-600" />
                      <span className="text-sm text-green-700">{docBack.name}</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Încarcă spatele documentului</span>
                    </>
                  )}
                </div>
              </button>
            </div>

            {/* Selfie */}
            <div>
              <label className="text-sm font-medium mb-2 block">Selfie cu documentul</label>
              <input
                ref={selfieInputRef}
                type="file"
                accept="image/*"
                capture="user"
                className="hidden"
                onChange={(e) => setSelfie(e.target.files?.[0] || null)}
              />
              <button
                onClick={() => selfieInputRef.current?.click()}
                className={`w-full p-6 border-2 border-dashed rounded-xl transition-all ${
                  selfie ? 'border-green-500 bg-green-50' : 'border-muted hover:border-primary/50'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  {selfie ? (
                    <>
                      <CheckCircle2 className="w-8 h-8 text-green-600" />
                      <span className="text-sm text-green-700">{selfie.name}</span>
                    </>
                  ) : (
                    <>
                      <Camera className="w-8 h-8 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Fă un selfie ținând documentul</span>
                    </>
                  )}
                </div>
              </button>
            </div>

            <Button 
              onClick={handleIdentitySubmit} 
              disabled={submitting || !docFront || !selfie}
              className="w-full"
            >
              {submitting ? "Se trimite..." : "Trimite pentru verificare"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Property Document Step
  if (step === 'property') {
    return (
      <div className="container max-w-2xl py-8 px-4">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => setStep('overview')}
            className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold">Verificare Proprietate</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Documente Proprietate</CardTitle>
            <CardDescription>
              Încarcă un document care dovedește că ești proprietarul imobilului.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 bg-green-100 text-green-800 text-sm rounded-lg flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                {success}
              </div>
            )}

            {/* Document Type */}
            <div>
              <label className="text-sm font-medium mb-2 block">Tipul documentului</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'PROPERTY_DEED', label: 'Act Proprietate' },
                  { value: 'UTILITY_BILL', label: 'Factură Utilități' },
                  { value: 'OTHER', label: 'Altele' },
                ].map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setPropDocType(type.value as PropertyDocType)}
                    className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                      propDocType === type.value
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-muted hover:border-primary/50'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Document Upload */}
            <div>
              <label className="text-sm font-medium mb-2 block">Document</label>
              <input
                ref={propInputRef}
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={(e) => setPropDoc(e.target.files?.[0] || null)}
              />
              <button
                onClick={() => propInputRef.current?.click()}
                className={`w-full p-8 border-2 border-dashed rounded-xl transition-all ${
                  propDoc ? 'border-green-500 bg-green-50' : 'border-muted hover:border-primary/50'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  {propDoc ? (
                    <>
                      <CheckCircle2 className="w-8 h-8 text-green-600" />
                      <span className="text-sm text-green-700">{propDoc.name}</span>
                    </>
                  ) : (
                    <>
                      <FileText className="w-8 h-8 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Încarcă documentul (PDF sau imagine)</span>
                    </>
                  )}
                </div>
              </button>
            </div>

            <Button 
              onClick={handlePropertySubmit} 
              disabled={submitting || !propDoc}
              className="w-full"
            >
              {submitting ? "Se trimite..." : "Trimite pentru verificare"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Overview
  const badge = getLevelBadge(status?.verificationLevel || 0);

  return (
    <div className="container max-w-2xl py-8 px-4">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold">Verificare Cont</h1>
      </div>

      {/* Current Level */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Nivelul tău de verificare</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${badge.color}`}>
                  {badge.label}
                </span>
                <span className="text-sm text-muted-foreground">
                  Level {status?.verificationLevel || 0}/3
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Verification Steps */}
      <div className="space-y-4">
        {/* Step 1: Email - Usually already done */}
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Email Verificat</p>
                <p className="text-sm text-muted-foreground">Contul tău de email este verificat</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step 2: Identity Verification */}
        <Card 
          className={`cursor-pointer transition-all ${
            status?.identityStatus !== 'APPROVED' ? 'hover:border-primary/50' : ''
          }`}
          onClick={() => status?.identityStatus !== 'APPROVED' && setStep('identity')}
        >
          <CardContent className="py-4">
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                status?.identityStatus === 'APPROVED' ? 'bg-green-100' :
                status?.identityStatus === 'PENDING' ? 'bg-yellow-100' :
                status?.identityStatus === 'REJECTED' ? 'bg-red-100' : 'bg-muted'
              }`}>
                {getStatusIcon(status?.identityStatus || 'NONE')}
              </div>
              <div className="flex-1">
                <p className="font-medium">Verificare Identitate</p>
                <p className="text-sm text-muted-foreground">
                  {status?.identityStatus === 'APPROVED' 
                    ? 'Identitatea ta este verificată'
                    : status?.identityStatus === 'PENDING'
                    ? 'Documentele tale sunt în curs de verificare'
                    : status?.identityStatus === 'REJECTED'
                    ? status?.rejectionReason || 'Verificarea a fost respinsă'
                    : 'Verifică-ți identitatea pentru a debloca toate funcțiile'}
                </p>
              </div>
              {status?.identityStatus !== 'APPROVED' && (
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Step 3: Property Verification */}
        <Card 
          className={`cursor-pointer transition-all ${
            status?.identityStatus === 'APPROVED' && status?.propertyStatus !== 'APPROVED' 
              ? 'hover:border-primary/50' 
              : ''
          }`}
          onClick={() => {
            if (status?.identityStatus === 'APPROVED' && status?.propertyStatus !== 'APPROVED') {
              setStep('property');
            }
          }}
        >
          <CardContent className="py-4">
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                status?.propertyStatus === 'APPROVED' ? 'bg-green-100' :
                status?.propertyStatus === 'PENDING' ? 'bg-yellow-100' :
                status?.propertyStatus === 'REJECTED' ? 'bg-red-100' : 'bg-muted'
              }`}>
                {getStatusIcon(status?.propertyStatus || 'NONE')}
              </div>
              <div className="flex-1">
                <p className="font-medium">Verificare Proprietate</p>
                <p className="text-sm text-muted-foreground">
                  {status?.propertyStatus === 'APPROVED' 
                    ? 'Ești un proprietar verificat'
                    : status?.propertyStatus === 'PENDING'
                    ? 'Documentele tale sunt în curs de verificare'
                    : status?.identityStatus !== 'APPROVED'
                    ? 'Necesită verificare identitate mai întâi'
                    : 'Devino un proprietar verificat'}
                </p>
              </div>
              {status?.identityStatus === 'APPROVED' && status?.propertyStatus !== 'APPROVED' && (
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Benefits */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Beneficii verificare</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Badge de verificare pe profil pentru mai multă încredere</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Acces la funcții avansate de mesagerie și vizionări</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Prioritate în rezultatele căutării</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
