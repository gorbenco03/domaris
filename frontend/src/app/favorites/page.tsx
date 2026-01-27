'use client';

/**
 * Favorites Page
 * Shows all favorited properties with options to compare and organize
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Heart, Grid, List, Scale, Trash2, Plus, Folder, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { favoritesApi, FavoriteProperty, FavoriteList } from '@/features/favorites/api';
import Link from 'next/link';

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<FavoriteProperty[]>([]);
  const [lists, setLists] = useState<FavoriteList[]>([]);
  const [activeList, setActiveList] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [favoritesData, listsData] = await Promise.all([
        favoritesApi.getFavorites({ listId: activeList === 'all' ? undefined : activeList }),
        favoritesApi.getLists(),
      ]);
      setFavorites(favoritesData.items);
      setLists([
        { id: 'all', name: 'Toate', count: favoritesData.total, isDefault: true },
        ...listsData,
      ]);
    } catch (err) {
      console.error('Failed to fetch favorites:', err);
      setError('Nu s-au putut încărca favoritele. Te rugăm să încerci din nou.');
    } finally {
      setIsLoading(false);
    }
  }, [activeList]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleRemove = async (propertyId: number) => {
    try {
      await favoritesApi.removeFavorite(propertyId);
      setFavorites(favorites.filter((f) => f.propertyId !== propertyId));
    } catch (err) {
      console.error('Failed to remove favorite:', err);
    }
  };

  const handleCompare = () => {
    if (selectedIds.size >= 2) {
      const ids = Array.from(selectedIds).join(',');
      window.location.href = `/favorites/compare?ids=${ids}`;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 container py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Favorite</h1>
            <p className="text-muted-foreground text-sm">
              {favorites.length} proprietăți salvate
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={isCompareMode ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setIsCompareMode(!isCompareMode);
                setSelectedIds(new Set());
              }}
            >
              <Scale className="w-4 h-4 mr-1.5" />
              Compară
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            >
              {viewMode === 'grid' ? (
                <List className="w-4 h-4" />
              ) : (
                <Grid className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* List chips */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {lists.map((list) => (
            <Button
              key={list.id}
              variant={activeList === list.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveList(list.id)}
              className="shrink-0"
            >
              {list.isDefault ? (
                <Heart className="w-4 h-4 mr-1.5" />
              ) : (
                <Folder className="w-4 h-4 mr-1.5" />
              )}
              {list.name}
              <Badge variant="secondary" className="ml-1.5">
                {list.count}
              </Badge>
            </Button>
          ))}
          <Button variant="ghost" size="sm" className="shrink-0">
            <Plus className="w-4 h-4 mr-1" />
            Listă nouă
          </Button>
        </div>

        {/* Compare mode actions */}
        {isCompareMode && selectedIds.size > 0 && (
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 mb-6 flex items-center justify-between">
            <span className="text-sm font-medium">
              {selectedIds.size} selectate
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                disabled={selectedIds.size < 2}
                onClick={handleCompare}
              >
                Compară ({selectedIds.size}/4)
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedIds(new Set())}
              >
                Anulează
              </Button>
            </div>
          </div>
        )}

        {/* Loading state */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <Card>
            <CardContent className="py-16 text-center">
              <p className="text-destructive">{error}</p>
              <Button variant="outline" onClick={fetchData} className="mt-4">
                Încearcă din nou
              </Button>
            </CardContent>
          </Card>
        ) : favorites.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <div className="w-20 h-20 rounded-full bg-muted mx-auto flex items-center justify-center mb-4">
                <Heart className="w-10 h-10 text-muted-foreground/50" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                Nicio proprietate salvată
              </h3>
              <p className="text-muted-foreground text-sm max-w-[300px] mx-auto mb-6">
                Explorează proprietăți și apasă pe inimă pentru a le salva aici.
              </p>
              <Button asChild>
                <Link href="/search">Caută proprietăți</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                : 'space-y-4'
            }
          >
            {favorites.map((favorite) => (
              <div key={favorite.id} className="relative group">
                {isCompareMode && (
                  <div className="absolute top-3 left-3 z-10">
                    <Checkbox
                      checked={selectedIds.has(String(favorite.id))}
                      onCheckedChange={() => toggleSelection(String(favorite.id))}
                      disabled={
                        !selectedIds.has(String(favorite.id)) && selectedIds.size >= 4
                      }
                    />
                  </div>
                )}
                <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                  <Link href={`/property/${favorite.propertyId}`}>
                    <div className="aspect-[4/3] relative overflow-hidden">
                      <img
                        src={favorite.imageUrl || '/placeholder.jpg'}
                        alt={favorite.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <CardContent className="p-4">
                      <p className="font-semibold text-lg">
                        €{favorite.price?.toLocaleString()}
                      </p>
                      <p className="font-medium text-sm truncate">
                        {favorite.title}
                      </p>
                      <p className="text-muted-foreground text-xs truncate">
                        {favorite.location}
                      </p>
                      <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                        {favorite.bedrooms && <span>{favorite.bedrooms} cam</span>}
                        {favorite.area && <span>{favorite.area} m²</span>}
                      </div>
                    </CardContent>
                  </Link>
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="destructive"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.preventDefault();
                        handleRemove(favorite.propertyId);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
