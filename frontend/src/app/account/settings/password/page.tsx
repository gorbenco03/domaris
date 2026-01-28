"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { authApi } from "@/features/auth/api";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!currentPassword) {
      setError("Te rugăm să introduci parola curentă");
      return;
    }

    if (newPassword.length < 8) {
      setError("Parola nouă trebuie să aibă cel puțin 8 caractere");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Parolele nu se potrivesc");
      return;
    }

    if (currentPassword === newPassword) {
      setError("Parola nouă trebuie să fie diferită de cea curentă");
      return;
    }

    setIsLoading(true);

    try {
      await authApi.changePassword({
        currentPassword,
        newPassword,
      });
      setSuccess(true);
      setTimeout(() => {
        router.push("/account/settings");
      }, 2000);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || "Nu am putut schimba parola. Verifică parola curentă.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container max-w-lg py-8 px-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold">Schimbă parola</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Actualizează parola</CardTitle>
          <CardDescription>
            Introdu parola curentă și alege o parolă nouă pentru contul tău.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Parola a fost schimbată!</h3>
              <p className="text-muted-foreground">Vei fi redirecționat...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Parola curentă</label>
                <div className="relative">
                  <Input
                    type={showPasswords ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Introdu parola curentă"
                    leftIcon={<Lock className="w-5 h-5" />}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Parola nouă</label>
                <Input
                  type={showPasswords ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Introdu parola nouă (min. 8 caractere)"
                  leftIcon={<Lock className="w-5 h-5" />}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Confirmă parola nouă</label>
                <Input
                  type={showPasswords ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirmă parola nouă"
                  leftIcon={<Lock className="w-5 h-5" />}
                />
              </div>

              <button
                type="button"
                onClick={() => setShowPasswords(!showPasswords)}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPasswords ? (
                  <>
                    <EyeOff className="w-4 h-4" />
                    Ascunde parolele
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4" />
                    Arată parolele
                  </>
                )}
              </button>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "Se schimbă..." : "Schimbă parola"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
