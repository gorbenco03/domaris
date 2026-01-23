"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Camera, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ProfileWrapper } from '@/components/profile/ProfileWrapper';
import { Avatar } from '@/components/profile/Avatar';
import { profileApi, IUser, IUpdateProfileRequest } from '@/features/profile/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export default function EditProfilePage() {
  const router = useRouter();
  const { updateUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState<IUser | null>(null);

  const { register, handleSubmit, setValue, formState: { errors, isDirty } } = useForm<IUpdateProfileRequest>();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await profileApi.getProfile();
        setProfile(data);
        // Pre-fill form
        setValue('firstName', data.firstName);
        setValue('lastName', data.lastName);
        setValue('phone', data.phone || '');
        setValue('bio', data.bio || '');
        setValue('location', data.location || '');
      } catch (error) {
        console.error('Failed to fetch profile', error);
      }
    };
    fetchProfile();
  }, [setValue]);

  const onSubmit = async (data: IUpdateProfileRequest) => {
    setIsLoading(true);
    try {
      const updatedUser = await profileApi.updateProfile(data);
      updateUser(updatedUser); // Update context
      toast.success('Profil actualizat', {
        description: 'Modificările au fost salvate cu succes.'
      });
      router.push('/account/profile');
    } catch (error) {
       console.error(error);
       toast.error('Eroare', {
        description: 'Nu am putut actualiza profilul.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        await profileApi.uploadAvatar(file);
        // Refresh profile to show new avatar
        const updatedProfile = await profileApi.getProfile();
        setProfile(updatedProfile);
        updateUser(updatedProfile);
        toast.success('Avatar actualizat');
      } catch (error) {
        console.error(error);
        toast.error('Eroare la încărcarea imaginii');
      }
    }
  };

  if (!profile) return null; // Or loading spinner

  return (
    <ProfileWrapper title="Editare Profil">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-2xl">
        
        {/* Avatar Upload */}
        <div className="flex flex-col items-center sm:flex-row gap-6 p-6 bg-slate-50 rounded-xl">
          <div className="relative group">
            <Avatar 
              source={profile.avatar} 
              firstName={profile.firstName} 
              lastName={profile.lastName} 
              size="lg"
              className="w-24 h-24"
            />
            <label className="absolute bottom-0 right-0 p-1.5 bg-primary text-white rounded-full cursor-pointer hover:bg-primary/90 transition-colors shadow-md">
              <Camera className="w-4 h-4" />
              <input 
                type="file" 
                className="hidden" 
                accept="image/*"
                onChange={handleAvatarChange}
              />
            </label>
          </div>
          <div>
            <h3 className="font-medium text-lg">Poză de profil</h3>
            <p className="text-sm text-muted-foreground mb-3">Acceptăm formate JPG, PNG sau WebP. Max 5MB.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Prenume</label>
            <Input 
                {...register('firstName', { required: 'Prenumele este obligatoriu' })} 
                placeholder="Prenume"
            />
            {errors.firstName && <p className="text-xs text-red-500">{errors.firstName.message}</p>}
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Nume</label>
            <Input 
                {...register('lastName', { required: 'Numele este obligatoriu' })} 
                placeholder="Nume"
            />
            {errors.lastName && <p className="text-xs text-red-500">{errors.lastName.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Telefon</label>
            <Input 
                {...register('phone')} 
                placeholder="Număr de telefon"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Locație</label>
            <Input 
                {...register('location')} 
                placeholder="Oraș, Județ"
            />
          </div>

          <div className="col-span-1 md:col-span-2 space-y-2">
            <label className="text-sm font-medium">Bio</label>
            <Textarea 
                {...register('bio')} 
                placeholder="Scrie câteva cuvinte despre tine..."
                className="min-h-[120px]"
            />
            <p className="text-xs text-muted-foreground text-right">{profile.bio?.length || 0}/500</p>
          </div>
        </div>

        <div className="flex items-center gap-4 pt-4 border-t">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Anulează
          </Button>
          <Button type="submit" disabled={isLoading || !isDirty} className="gap-2">
            {isLoading ? 'Se salvează...' : (
                <>
                    <Save className="w-4 h-4" />
                    Salvează Modificările
                </>
            )}
          </Button>
        </div>

      </form>
    </ProfileWrapper>
  );
}
