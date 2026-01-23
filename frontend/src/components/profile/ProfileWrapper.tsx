"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  User, 
  Settings, 
  Shield, 
  Bell, 
  LogOut, 
  Home,
  CreditCard
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

interface ProfileWrapperProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

export function ProfileWrapper({ children, title, description }: ProfileWrapperProps) {
  const pathname = usePathname();
  const { logout } = useAuth();

  const menuItems = [
    {
      label: 'Profil',
      href: '/account/profile',
      icon: User,
    },
    {
      label: 'Proprietățile mele',
      href: '/account/properties',
      icon: Home,
    },
    {
      label: 'Mesaje',
      href: '/messages',
      icon: Bell, // Using Bell for now, could be MessageSquare
    },
    {
      label: 'Setări',
      href: '/account/settings',
      icon: Settings,
    },
    {
      label: 'Securitate',
      href: '/account/security',
      icon: Shield,
    },
    {
      label: 'Abonament',
      href: '/account/billing',
      icon: CreditCard,
    },
  ];

  return (
    <div className="container py-10 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <aside className="w-full md:w-64 shrink-0 space-y-8">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight mb-6">Contul Meu</h2>
            <nav className="flex flex-col space-y-1">
              {menuItems.map((item) => {
                const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                      isActive 
                        ? "bg-primary text-primary-foreground" 
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          
          <div className="pt-4 border-t">
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-3 text-red-500 hover:text-red-600 hover:bg-red-50"
              onClick={logout}
            >
              <LogOut className="w-4 h-4" />
              Deconectare
            </Button>
          </div>
        </aside>

        {/* content */}
        <main className="flex-1">
          {(title || description) && (
            <div className="mb-6">
              {title && <h1 className="text-3xl font-bold tracking-tight">{title}</h1>}
              {description && <p className="text-muted-foreground mt-2">{description}</p>}
            </div>
          )}
          
          <div className="bg-white rounded-lg border shadow-sm p-6 min-h-[500px]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
