"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Loader2, Camera, User, Save, Bell } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { 
  getCurrentProfile, 
  updateProfile, 
  uploadAvatar,
  getNotificationPreferences,
  updateNotificationPreferences,
  UserProfile,
  NotificationPreferences 
} from "@/lib/userApi";
import { toast } from "sonner";

export default function SettingsPage() {
  const { isAuthenticated, isLoading: isAuthLoading, user } = useAuth();
  
  // Profile state
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  
  // Notification preferences
  const [notifications, setNotifications] = useState<NotificationPreferences | null>(null);
  
  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications'>('profile');

  useEffect(() => {
    const fetchData = async () => {
      if (!isAuthenticated) return;
      
      setIsLoading(true);
      
      try {
        const [profileData, notifData] = await Promise.all([
          getCurrentProfile(),
          getNotificationPreferences().catch(() => null)
        ]);
        
        setProfile(profileData);
        setFirstName(profileData.firstName || "");
        setLastName(profileData.lastName || "");
        setPhone(profileData.phone || "");
        setBio(profileData.bio || "");
        
        if (notifData) {
          setNotifications(notifData);
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err);
        // Use auth context user as fallback
        if (user) {
          setFirstName(user.firstName || "");
          setLastName(user.lastName || "");
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    if (!isAuthLoading) {
      fetchData();
    }
  }, [isAuthenticated, isAuthLoading, user]);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    
    try {
      await updateProfile({
        firstName,
        lastName,
        phone,
        bio,
      });
      toast.success("Profilul a fost actualizat!");
    } catch (err) {
      console.error("Failed to update profile:", err);
      toast.error("Nu am putut actualiza profilul");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const result = await uploadAvatar(file);
      toast.success("Avatar actualizat!");
      if (profile) {
        setProfile({ ...profile, avatar: result.avatarUrl });
      }
    } catch (err) {
      console.error("Failed to upload avatar:", err);
      toast.error("Nu am putut încărca avatarul");
    }
  };

  const handleNotificationToggle = async (key: keyof NotificationPreferences) => {
    if (!notifications) return;
    
    const newValue = !notifications[key];
    const updated = { ...notifications, [key]: newValue };
    setNotifications(updated);
    
    try {
      await updateNotificationPreferences({ [key]: newValue });
    } catch (err) {
      console.error("Failed to update notifications:", err);
      // Revert on error
      setNotifications(notifications);
      toast.error("Nu am putut actualiza preferințele");
    }
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="mx-auto max-w-2xl px-4 py-20 text-center">
          <User className="mx-auto h-16 w-16 text-muted-foreground" />
          <h1 className="mt-4 text-2xl font-bold">Autentificare necesară</h1>
          <p className="mt-2 text-muted-foreground">
            Trebuie să fii autentificat pentru a accesa setările.
          </p>
          <Button asChild className="mt-6">
            <Link href="/auth">Autentifică-te</Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6">
          <Link href="/profile" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Înapoi la profil
          </Link>
        </div>

        <h1 className="mb-6 text-3xl font-bold">Setări cont</h1>

        {/* Tabs */}
        <div className="mb-6 flex gap-2 border-b border-border">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'profile'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Profil
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'notifications'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Notificări
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : activeTab === 'profile' ? (
          <div className="space-y-6">
            {/* Avatar */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                  {profile?.avatar ? (
                    <img src={profile.avatar} alt="" className="h-full w-full rounded-full object-cover" />
                  ) : (
                    firstName[0]?.toUpperCase() || "U"
                  )}
                </div>
                <label className="absolute bottom-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-accent text-accent-foreground transition-colors hover:bg-accent/90">
                  <Camera className="h-4 w-4" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </label>
              </div>
              <div>
                <p className="font-medium">{firstName} {lastName}</p>
                <p className="text-sm text-muted-foreground">{profile?.email || user?.email}</p>
              </div>
            </div>

            {/* Form */}
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Prenume</label>
                  <Input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Prenumele tău"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Nume</label>
                  <Input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Numele tău"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">Telefon</label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+373 ..."
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Spune ceva despre tine..."
                  className="min-h-[100px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </div>

            <Button onClick={handleSaveProfile} disabled={isSaving} className="w-full">
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Salvează modificările
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications ? (
              <>
                <NotificationToggle
                  label="Notificări email"
                  description="Primește notificări prin email"
                  checked={notifications.emailNotifications}
                  onChange={() => handleNotificationToggle('emailNotifications')}
                />
                <NotificationToggle
                  label="Mesaje noi"
                  description="Notificări pentru mesaje primite"
                  checked={notifications.newMessages}
                  onChange={() => handleNotificationToggle('newMessages')}
                />
                <NotificationToggle
                  label="Actualizări vizionări"
                  description="Notificări pentru programări și modificări"
                  checked={notifications.viewingUpdates}
                  onChange={() => handleNotificationToggle('viewingUpdates')}
                />
                <NotificationToggle
                  label="Alerte de preț"
                  description="Notificări când prețurile se schimbă"
                  checked={notifications.priceAlerts}
                  onChange={() => handleNotificationToggle('priceAlerts')}
                />
                <NotificationToggle
                  label="Anunțuri noi"
                  description="Notificări pentru proprietăți noi"
                  checked={notifications.newListings}
                  onChange={() => handleNotificationToggle('newListings')}
                />
                <NotificationToggle
                  label="Email-uri marketing"
                  description="Oferte și noutăți de la RIVA"
                  checked={notifications.marketingEmails}
                  onChange={() => handleNotificationToggle('marketingEmails')}
                />
              </>
            ) : (
              <div className="rounded-lg border border-border bg-card p-6 text-center">
                <Bell className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-2 text-muted-foreground">
                  Preferințele de notificări nu sunt disponibile momentan
                </p>
              </div>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

function NotificationToggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
      <div>
        <p className="font-medium">{label}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <button
        onClick={onChange}
        className={`relative h-6 w-11 rounded-full transition-colors ${
          checked ? 'bg-primary' : 'bg-muted'
        }`}
      >
        <span
          className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}
