"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Edit2, MapPin, Calendar, Star, Home as HomeIcon, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProfileWrapper } from '@/components/profile/ProfileWrapper';
import { Avatar } from '@/components/profile/Avatar';
import { profileApi, IUser } from '@/features/profile/api';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';

export default function ProfilePage() {
  const { user: authUser } = useAuth();
  const [profile, setProfile] = useState<IUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await profileApi.getProfile();
        setProfile(data);
      } catch (error) {
        console.error('Failed to fetch profile', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) {
    return (
        <ProfileWrapper>
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        </ProfileWrapper>
    );
  }

  // Fallback to auth user if profile fetch fails or while loading
  const displayUser = profile || (authUser as any);

  if (!displayUser) return null;

  return (
    <ProfileWrapper title="Profil" description="Gestionează informațiile personale și setările contului.">
      <div className="space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row gap-6 items-start border-b pb-8">
          <Avatar 
            source={displayUser.avatar} 
            firstName={displayUser.firstName} 
            lastName={displayUser.lastName} 
            size="xl"
            verified={displayUser.verificationLevel >= 2}
            className="w-32 h-32"
          />
          
          <div className="flex-1 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold">{displayUser.firstName} {displayUser.lastName}</h2>
                <div className="flex items-center text-muted-foreground mt-1">
                  <MapPin className="w-4 h-4 mr-1" />
                  <span>{displayUser.location || 'Locație nespecificată'}</span>
                </div>
                <div className="flex items-center text-muted-foreground mt-1">
                  <Calendar className="w-4 h-4 mr-1" />
                  <span>Membru din {displayUser.createdAt ? format(new Date(displayUser.createdAt), 'MMMM yyyy', { locale: ro }) : '-'}</span>
                </div>
              </div>
              
              <Link href="/account/profile/edit">
                <Button variant="outline" className="gap-2">
                  <Edit2 className="w-4 h-4" />
                  Editează
                </Button>
              </Link>
            </div>

            {displayUser.bio && (
              <p className="text-gray-600 max-w-2xl">{displayUser.bio}</p>
            )}

            {/* Badges / Stats */}
            <div className="flex gap-4 pt-2">
                {displayUser.verificationLevel >= 2 && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Identitate Verificată
                    </span>
                )}
                {displayUser.role === 'LANDLORD' && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Proprietar
                    </span>
                )}
            </div>
          </div>
        </div>

        {/* Stats Section */}
        {displayUser.activeListingsCount > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-50 p-4 rounded-lg flex items-center gap-4">
              <div className="p-3 bg-white rounded-full shadow-sm">
                <HomeIcon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{displayUser.activeListingsCount}</p>
                <p className="text-sm text-muted-foreground">Anunțuri Active</p>
              </div>
            </div>
            
            <div className="bg-slate-50 p-4 rounded-lg flex items-center gap-4">
              <div className="p-3 bg-white rounded-full shadow-sm">
                <Star className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{displayUser.rating || '-'}</p>
                <p className="text-sm text-muted-foreground">Rating ({displayUser.reviewsCount || 0} recenzii)</p>
              </div>
            </div>

             <div className="bg-slate-50 p-4 rounded-lg flex items-center gap-4">
              <div className="p-3 bg-white rounded-full shadow-sm">
                <Eye className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">-</p>
                <p className="text-sm text-muted-foreground">Vizualizări Lunare</p>
              </div>
            </div>
          </div>
        )}

        {/* Contact Info */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Informații Contact</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <label className="text-xs text-muted-foreground uppercase font-bold">Email</label>
              <p className="text-sm font-medium mt-1">{displayUser.email}</p>
            </div>
            <div className="p-4 border rounded-lg">
              <label className="text-xs text-muted-foreground uppercase font-bold">Telefon</label>
              <p className="text-sm font-medium mt-1">{displayUser.phone || '-'}</p>
            </div>
          </div>
        </div>

      </div>
    </ProfileWrapper>
  );
}
