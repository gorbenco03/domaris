"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Mail, Phone, User, Lock } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function RegisterPage() {
  const [method, setMethod] = useState<'email' | 'phone'>('email');
  
  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  
  const { register } = useAuth();
  const router = useRouter();

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = 'Full name is required';

    if (method === 'email') {
        if (!email.trim()) newErrors.email = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Invalid email format';
    } else {
        if (!phone.trim()) newErrors.phone = 'Phone number is required';
    }

    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 8) newErrors.password = 'Min 8 characters';
    // Add more password checks if needed matching mobile

    if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    if (!acceptTerms) newErrors.terms = 'You must accept the terms';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    setIsLoading(true);
    setErrors({});
    
    // Split name
    const nameParts = name.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || '';

    try {
        const data = method === 'email' 
            ? { email, password, firstName, lastName }
            : { phone, password, firstName, lastName }; // Phone logic might be specific
            
        await register(data);
        // On success, redirect to verify
        if (method === 'email') {
            router.push(`/auth/verify?email=${encodeURIComponent(email)}`);
        } else {
             // For phone, we might need a different page or same page if it supports phone
             // Assuming verify page supports email for now based on file analysis
             router.push('/auth/login?registered=true'); 
        }
    } catch (err: any) {
        console.error(err);
        setErrors({ root: err.response?.data?.message || "Registration failed" });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden flex flex-col">
       {/* Background Elements matching mobile - consistent with login */}
       <div 
         className="absolute top-0 left-0 right-0 h-[30vh] rounded-b-[40px] z-0" 
         style={{ background: 'var(--gradient-hero)' }}
       />
       
       <div className="z-10 flex-1 flex flex-col px-6 pt-8 max-w-md mx-auto w-full">
         {/* Method Tabs - Centered at top like mobile header? Or inside card? Mobile has it in card. */}
         
         <div className="mb-6 flex justify-between items-center text-white">
            <button onClick={() => router.back()} className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center hover:bg-white/20 transition-colors">
                <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-2xl font-bold">Create Account</h1>
            <div className="w-10" /> {/* Spacer */}
         </div>

         {/* Card */}
         <div className="bg-white rounded-3xl shadow-card p-6 mb-6">
            
            {/* Tabs */}
            <div className="flex gap-3 mb-6">
                <button
                    type="button"
                    onClick={() => setMethod('email')}
                    className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border transition-all",
                        method === 'email' 
                            ? "border-primary bg-primary/5 text-primary ring-1 ring-primary" 
                            : "border-slate-200 text-slate-500 hover:bg-slate-50"
                    )}
                >
                    <Mail className="w-4 h-4" />
                    <span className="font-semibold text-sm">Email</span>
                </button>
                <button
                    type="button"
                    onClick={() => setMethod('phone')}
                    className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border transition-all",
                        method === 'phone' 
                            ? "border-primary bg-primary/5 text-primary ring-1 ring-primary" 
                            : "border-slate-200 text-slate-500 hover:bg-slate-50"
                    )}
                >
                    <Phone className="w-4 h-4" />
                    <span className="font-semibold text-sm">Phone</span>
                </button>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
                <div>
                     <Input 
                        placeholder="Full Name" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        leftIcon={<User className="w-5 h-5" />}
                        className={cn(errors.name && "border-destructive focus-visible:ring-destructive")}
                     />
                     {errors.name && <p className="text-destructive text-xs mt-1 ml-1">{errors.name}</p>}
                </div>

                {method === 'email' ? (
                    <div>
                         <Input 
                            placeholder="Email" 
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            leftIcon={<Mail className="w-5 h-5" />}
                            className={cn(errors.email && "border-destructive focus-visible:ring-destructive")}
                         />
                         {errors.email && <p className="text-destructive text-xs mt-1 ml-1">{errors.email}</p>}
                    </div>
                ) : (
                    <div>
                         <Input 
                            placeholder="Phone number" 
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            leftIcon={<Phone className="w-5 h-5" />}
                            className={cn(errors.phone && "border-destructive focus-visible:ring-destructive")}
                         />
                         {errors.phone && <p className="text-destructive text-xs mt-1 ml-1">{errors.phone}</p>}
                    </div>
                )}

                <div>
                    <Input 
                        placeholder="Password" 
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        leftIcon={<Lock className="w-5 h-5" />}
                        className={cn(errors.password && "border-destructive focus-visible:ring-destructive")}
                    />
                     {errors.password && <p className="text-destructive text-xs mt-1 ml-1">{errors.password}</p>}
                </div>

                <div>
                    <Input 
                        placeholder="Confirm Password" 
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        leftIcon={<Lock className="w-5 h-5" />}
                        className={cn(errors.confirmPassword && "border-destructive focus-visible:ring-destructive")}
                    />
                     {errors.confirmPassword && <p className="text-destructive text-xs mt-1 ml-1">{errors.confirmPassword}</p>}
                </div>

                <div className="flex items-start gap-3 mt-4">
                    <input 
                        type="checkbox" 
                        id="terms" 
                        checked={acceptTerms}
                        onChange={(e) => setAcceptTerms(e.target.checked)}
                        className="mt-1 w-4 h-4 rounded border-gray-300 text-accent focus:ring-accent"
                    />
                    <label htmlFor="terms" className="text-sm text-slate-600">
                        I accept the <Link href="/terms" className="text-accent font-semibold">Terms & Conditions</Link> and <Link href="/privacy" className="text-accent font-semibold">Privacy Policy</Link>
                    </label>
                </div>
                {errors.terms && <p className="text-destructive text-xs ml-1">{errors.terms}</p>}


                {errors.root && (
                    <div className="p-3 bg-red-50 text-destructive text-sm rounded-lg text-center">
                        {errors.root}
                    </div>
                )}

                <Button type="submit" className="w-full mt-4" disabled={isLoading}>
                    {isLoading ? 'Creating Account...' : 'Continue'}
                </Button>
            </form>
         </div>

         {/* Login Link */}
         <div className="flex items-center justify-center gap-1 text-slate-500 mb-8">
            <span>Already have an account?</span>
            <Link href="/auth/login" className="text-accent font-bold hover:underline">
                Log In
            </Link>
         </div>
       </div>
    </div>
  );
}
