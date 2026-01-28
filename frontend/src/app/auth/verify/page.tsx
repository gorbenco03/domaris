"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authApi } from "@/features/auth/api";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail, RefreshCw } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown for resend
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
      return;
    }
  }, [resendTimer]);

  // Auto-focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    // Only accept numbers
    if (value && !/^\d+$/.test(value)) return;

    const newCode = [...code];
    
    // Handle paste
    if (value.length > 1) {
      const pastedCode = value.slice(0, 6).split('');
      pastedCode.forEach((digit, i) => {
        if (i < 6) newCode[i] = digit;
      });
      setCode(newCode);
      // Focus last filled input or last input
      const lastIndex = Math.min(pastedCode.length - 1, 5);
      inputRefs.current[lastIndex]?.focus();
      return;
    }

    newCode[index] = value;
    setCode(newCode);

    // Auto advance to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await authApi.verifyEmailOtp({ email, code: fullCode });
      
      if (response.accessToken) {
        localStorage.setItem("accessToken", response.accessToken);
        if (response.refreshToken) {
          localStorage.setItem("refreshToken", response.refreshToken);
        }
        // Redirect to dashboard or home
        router.push('/');
      }
    } catch (err: unknown) {
      console.error(err);
      const errorMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Invalid or expired code';
      setError(errorMessage);
      // Clear code on error
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend || isResending) return;
    
    setIsResending(true);
    setError('');

    try {
      // We need the registration data to resend, but we only have email
      // The backend will resend if we call register again with the same email
      // For now, we'll just show a message that they need to re-register
      // Actually, looking at the backend, we need the full registration data
      // Let's redirect back to register page
      router.push('/auth/register?resend=true');
    } catch (err: unknown) {
      console.error(err);
      const errorMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to resend code';
      setError(errorMessage);
    } finally {
      setIsResending(false);
    }
  };

  if (!email) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-card p-6 max-w-md w-full text-center">
          <h1 className="text-xl font-bold text-slate-800 mb-4">Invalid Access</h1>
          <p className="text-slate-600 mb-6">Please register first to verify your email.</p>
          <Link href="/auth/register">
            <Button className="w-full">
              Go to Registration
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden flex flex-col">
      {/* Background Elements */}
      <div 
        className="absolute top-0 left-0 right-0 h-[30vh] rounded-b-[40px] z-0" 
        style={{ background: 'var(--gradient-hero)' }}
      />
      
      <div className="z-10 flex-1 flex flex-col px-6 pt-8 max-w-md mx-auto w-full">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center text-white">
          <button 
            onClick={() => router.back()} 
            className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold">Verify Email</h1>
          <div className="w-10" />
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-card p-6 mb-6">
          {/* Icon */}
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Mail className="w-8 h-8 text-primary" />
          </div>

          <h2 className="text-xl font-bold text-center text-slate-800 mb-2">
            Check your email
          </h2>
          <p className="text-slate-500 text-center text-sm mb-6">
            We've sent a 6-digit verification code to<br />
            <span className="font-semibold text-slate-700">{email}</span>
          </p>

          {/* OTP Input */}
          <div className="flex gap-2 justify-center mb-6">
            {code.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { inputRefs.current[index] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className={cn(
                  "w-12 h-14 text-center text-xl font-bold rounded-xl border-2 transition-all",
                  "focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20",
                  error ? "border-destructive" : "border-slate-200"
                )}
              />
            ))}
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-destructive text-sm rounded-lg text-center mb-4">
              {error}
            </div>
          )}

          <Button 
            onClick={handleVerify}
            disabled={isLoading || code.join('').length !== 6}
            className="w-full"
          >
            {isLoading ? 'Verifying...' : 'Verify Email'}
          </Button>

          {/* Resend */}
          <div className="mt-6 text-center">
            <p className="text-slate-500 text-sm mb-2">
              Didn't receive the code?
            </p>
            {canResend ? (
              <button
                onClick={handleResend}
                disabled={isResending}
                className="text-accent font-semibold text-sm flex items-center gap-2 mx-auto hover:underline"
              >
                <RefreshCw className={cn("w-4 h-4", isResending && "animate-spin")} />
                {isResending ? 'Sending...' : 'Resend Code'}
              </button>
            ) : (
              <p className="text-slate-400 text-sm">
                Resend in {resendTimer}s
              </p>
            )}
          </div>
        </div>

        {/* Back to Login */}
        <div className="flex items-center justify-center gap-1 text-slate-500 mb-8">
          <span>Remember your password?</span>
          <Link href="/auth/login" className="text-accent font-bold hover:underline">
            Log In
          </Link>
        </div>
      </div>
    </div>
  );
}
