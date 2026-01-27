'use client';

/**
 * Settings Page
 * User settings and preferences
 */

import React from 'react';
import {
  Bell,
  Lock,
  Shield,
  Globe,
  Moon,
  LogOut,
  ChevronRight,
  User,
  HelpCircle,
  FileText,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface SettingsItem {
  icon: React.ReactNode;
  label: string;
  description?: string;
  href?: string;
  action?: () => void;
  rightElement?: React.ReactNode;
  destructive?: boolean;
}

export default function SettingsPage() {
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = async () => {
    if (confirm('Ești sigur că vrei să te deconectezi?')) {
      await logout();
      router.push('/');
    }
  };

  const accountSettings: SettingsItem[] = [
    {
      icon: <User className="w-5 h-5" />,
      label: 'Editează profilul',
      description: 'Numele, fotografia, bio',
      href: '/account/profile/edit',
    },
    {
      icon: <Lock className="w-5 h-5" />,
      label: 'Schimbă parola',
      description: 'Actualizează parola contului',
      href: '/account/settings/password',
    },
    {
      icon: <Shield className="w-5 h-5" />,
      label: 'Verificare identitate',
      description: 'Verifică-ți contul pentru mai multă încredere',
      href: '/account/verification',
    },
  ];

  const notificationSettings: SettingsItem[] = [
    {
      icon: <Bell className="w-5 h-5" />,
      label: 'Notificări',
      description: 'Gestionează preferințele de notificare',
      href: '/account/notifications',
    },
  ];

  const preferenceSettings: SettingsItem[] = [
    {
      icon: <Globe className="w-5 h-5" />,
      label: 'Limba',
      rightElement: <span className="text-muted-foreground text-sm">Română</span>,
    },
    {
      icon: <Moon className="w-5 h-5" />,
      label: 'Temă întunecată',
      rightElement: <Switch />,
    },
  ];

  const supportSettings: SettingsItem[] = [
    {
      icon: <HelpCircle className="w-5 h-5" />,
      label: 'Ajutor & Suport',
      href: '/help',
    },
    {
      icon: <FileText className="w-5 h-5" />,
      label: 'Termeni și condiții',
      href: '/terms',
    },
    {
      icon: <Shield className="w-5 h-5" />,
      label: 'Politica de confidențialitate',
      href: '/privacy',
    },
  ];

  const renderSettingsGroup = (title: string, items: SettingsItem[]) => (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {items.map((item, index) => {
          const content = (
            <div
              className={`flex items-center gap-4 px-4 py-3.5 ${
                item.href || item.action ? 'hover:bg-muted/50 cursor-pointer' : ''
              } ${item.destructive ? 'text-destructive' : ''}`}
              onClick={item.action}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  item.destructive ? 'bg-destructive/10' : 'bg-muted'
                }`}
              >
                {item.icon}
              </div>
              <div className="flex-1">
                <p className="font-medium">{item.label}</p>
                {item.description && (
                  <p className="text-sm text-muted-foreground">
                    {item.description}
                  </p>
                )}
              </div>
              {item.rightElement || (
                item.href && <ChevronRight className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
          );

          return (
            <div key={item.label}>
              {item.href ? (
                <Link href={item.href}>{content}</Link>
              ) : (
                content
              )}
              {index < items.length - 1 && <Separator />}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );

  return (
    <div className="container max-w-2xl py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Setări</h1>

      {renderSettingsGroup('Cont', accountSettings)}
      {renderSettingsGroup('Notificări', notificationSettings)}
      {renderSettingsGroup('Preferințe', preferenceSettings)}
      {renderSettingsGroup('Suport', supportSettings)}

      {/* Logout button */}
      <Card>
        <CardContent className="p-0">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-4 py-3.5 text-destructive hover:bg-destructive/5"
          >
            <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
              <LogOut className="w-5 h-5" />
            </div>
            <span className="font-medium">Deconectare</span>
          </button>
        </CardContent>
      </Card>

      {/* App version */}
      <p className="text-center text-sm text-muted-foreground mt-8">
        Versiune 1.0.0
      </p>
    </div>
  );
}
