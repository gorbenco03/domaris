"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface Property {
  id: string; // Changed to string to match shared types
  image: string;
  title: string;
  location: string;
  price: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  type: string;
}

interface Wishlist {
  id: number;
  name: string;
  description: string;
  properties: Property[];
  isShared: boolean;
  shareLink?: string;
}

interface FavoritesContextType {
  favorites: Property[];
  wishlists: Wishlist[];
  addFavorite: (property: Property) => void;
  removeFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  toggleFavorite: (property: Property) => void;
  createWishlist: (name: string, description: string) => void;
  deleteWishlist: (wishlistId: number) => void;
  addToWishlist: (wishlistId: number, propertyId: string) => void;
  removeFromWishlist: (wishlistId: number, propertyId: string) => void;
  shareWishlist: (wishlistId: number) => void;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error("useFavorites must be used within a FavoritesProvider");
  }
  return context;
};

export const FavoritesProvider = ({ children }: { children: ReactNode }) => {
  const [favorites, setFavorites] = useState<Property[]>([]);
  const [wishlists, setWishlists] = useState<Wishlist[]>([]);

  useEffect(() => {
    const savedFavorites = localStorage.getItem("favorites");
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
    const savedWishlists = localStorage.getItem("wishlists");
    if (savedWishlists) {
      setWishlists(JSON.parse(savedWishlists));
    }
  }, []);

  useEffect(() => {
    if (favorites.length > 0) {
      localStorage.setItem("favorites", JSON.stringify(favorites));
    }
  }, [favorites]);

  useEffect(() => {
    if (wishlists.length > 0) {
      localStorage.setItem("wishlists", JSON.stringify(wishlists));
    }
  }, [wishlists]);

  const addFavorite = (property: Property) => {
    setFavorites((prev) => {
      if (prev.some((p) => p.id === property.id)) return prev;
      return [...prev, property];
    });
  };

  const removeFavorite = (id: string) => {
    setFavorites((prev) => prev.filter((p) => p.id !== id));
  };

  const isFavorite = (id: string) => {
    return favorites.some((p) => p.id === id);
  };

  const toggleFavorite = (property: Property) => {
    if (isFavorite(property.id)) {
      removeFavorite(property.id);
    } else {
      addFavorite(property);
    }
  };

  const createWishlist = (name: string, description: string) => {
    const newWishlist: Wishlist = {
      id: Date.now(),
      name,
      description,
      properties: [],
      isShared: false,
    };
    setWishlists((prev) => [...prev, newWishlist]);
  };

  const deleteWishlist = (wishlistId: number) => {
    setWishlists((prev) => prev.filter((wl) => wl.id !== wishlistId));
  };

  const addToWishlist = (wishlistId: number, propertyId: string) => {
    const property = favorites.find((p) => p.id === propertyId);
    if (!property) return;

    setWishlists((prev) =>
      prev.map((wl) => {
        if (wl.id === wishlistId) {
          if (wl.properties.some((p) => p.id === propertyId)) return wl;
          return { ...wl, properties: [...wl.properties, property] };
        }
        return wl;
      })
    );
  };

  const removeFromWishlist = (wishlistId: number, propertyId: string) => {
    setWishlists((prev) =>
      prev.map((wl) => {
        if (wl.id === wishlistId) {
          return {
            ...wl,
            properties: wl.properties.filter((p) => p.id !== propertyId),
          };
        }
        return wl;
      })
    );
  };

  const shareWishlist = (wishlistId: number) => {
    const shareLink = `${window.location.origin}/shared-wishlist/${wishlistId}`;
    navigator.clipboard.writeText(shareLink);

    setWishlists((prev) =>
      prev.map((wl) => {
        if (wl.id === wishlistId) {
          return { ...wl, isShared: true, shareLink };
        }
        return wl;
      })
    );
  };

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        wishlists,
        addFavorite,
        removeFavorite,
        isFavorite,
        toggleFavorite,
        createWishlist,
        deleteWishlist,
        addToWishlist,
        removeFromWishlist,
        shareWishlist,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};
