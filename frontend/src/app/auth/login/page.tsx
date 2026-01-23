"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Home, Mail, Lock, Phone, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const [method, setMethod] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; phone?: string; password?: string; root?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    try {
        // Basic validation
        if (method === 'email' && !email) {
            setErrors(prev => ({ ...prev, email: "Email is required" }));
            setIsLoading(false);
            return;
        }
        if (!password) {
            setErrors(prev => ({ ...prev, password: "Password is required" }));
            setIsLoading(false);
            return;
        }

        if (method === 'email') {
            await login(email, password);
             // Redirect after login - ideally functionality should be in AuthContext or here
            router.push('/tenant/dashboard'); // Default to tenant for now, or check user role
        } else {
            // Phone login not yet implemented in context
            alert("Phone login not yet supported on web");
        }
    } catch (err: any) {
        console.error(err);
        setErrors({ root: err.response?.data?.message || "Login failed" });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden flex flex-col">
       {/* Background Elements matching mobile */}
       <div className="absolute top-0 left-0 right-0 h-[42vh] bg-gradient-to-br from-emerald-900 to-emerald-600 rounded-b-[40px] z-0" />
       <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-white/10 z-0" />
       <div className="absolute top-[25vh] -left-20 w-52 h-52 rounded-full bg-white/5 z-0" />

       <div className="z-10 flex-1 flex flex-col px-6 pt-8 max-w-md mx-auto w-full">
         {/* Header */}
         <div className="mb-8">
            <button onClick={() => router.back()} className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center hover:bg-white/20 transition-colors">
                <ArrowLeft className="w-6 h-6 text-white" />
            </button>
         </div>

         {/* Content */}
         <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30 mb-5">
                <Home className="w-7 h-7 text-emerald-500" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Welcome Back!</h1>
            <p className="text-white/80">Log in to continue</p>
         </div>

         {/* Card */}
         <div className="bg-white rounded-3xl shadow-xl p-6 mb-6">
            {/* Tabs */}
            <div className="flex gap-3 mb-6">
                <button
                    onClick={() => setMethod('email')}
                    className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border transition-all",
                        method === 'email' 
                            ? "border-emerald-500 bg-emerald-50 text-emerald-600 ring-1 ring-emerald-500" 
                            : "border-slate-200 text-slate-500 hover:bg-slate-50"
                    )}
                >
                    <Mail className="w-4 h-4" />
                    <span className="font-semibold text-sm">Email</span>
                </button>
                <button
                    onClick={() => setMethod('phone')}
                    className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border transition-all",
                        method === 'phone' 
                            ? "border-emerald-500 bg-emerald-50 text-emerald-600 ring-1 ring-emerald-500" 
                            : "border-slate-200 text-slate-500 hover:bg-slate-50"
                    )}
                >
                    <Phone className="w-4 h-4" />
                    <span className="font-semibold text-sm">Phone</span>
                </button>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
                {method === 'email' ? (
                    <div className="space-y-4">
                        <div>
                             <Input 
                                placeholder="Email" 
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                leftIcon={<Mail className="w-5 h-5" />}
                                className={cn(errors.email && "border-red-500 focus-visible:ring-red-500")}
                             />
                             {errors.email && <p className="text-red-500 text-xs mt-1 ml-1">{errors.email}</p>}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                         <div>
                             <Input 
                                placeholder="Phone number" 
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                leftIcon={<Phone className="w-5 h-5" />}
                                className={cn(errors.phone && "border-red-500 focus-visible:ring-red-500")}
                             />
                             {errors.phone && <p className="text-red-500 text-xs mt-1 ml-1">{errors.phone}</p>}
                        </div>
                    </div>
                )}

                <div>
                    <Input 
                        placeholder="Password" 
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        leftIcon={<Lock className="w-5 h-5" />}
                        className={cn(errors.password && "border-red-500 focus-visible:ring-red-500")}
                    />
                     {errors.password && <p className="text-red-500 text-xs mt-1 ml-1">{errors.password}</p>}
                </div>

                <div className="flex justify-end">
                    <Link href="/auth/forgot-password" className="text-emerald-500 text-sm font-semibold hover:text-emerald-600">
                        Forgot Password?
                    </Link>
                </div>

                {errors.root && (
                    <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center">
                        {errors.root}
                    </div>
                )}

                <Button type="submit" className="w-full bg-emerald-900 hover:bg-emerald-800 text-white h-12 rounded-xl text-base font-semibold" disabled={isLoading}>
                    {isLoading ? 'Logging in...' : 'Login'}
                </Button>
            </form>
         </div>

         {/* Register Link */}
         <div className="flex items-center justify-center gap-1 text-slate-500 mb-8">
            <span>Don't have an account?</span>
            <Link href="/auth/register" className="text-emerald-600 font-bold hover:underline">
                Sign Up
            </Link>
         </div>
       </div>
    </div>
  );
}
