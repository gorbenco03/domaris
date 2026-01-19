import { User } from './user.interface.js';

export enum ListingStatus {
    NEW = 'new',
    EARLY_ACCESS = 'early_access',
    PUBLIC = 'public',
    RENTED = 'rented',
    HIDDEN = 'hidden',
    EXPIRED = 'expired',
}

export interface ListingImage {
    id: number;
    listingId: number;
    url: string;
    isMain: boolean;
    createdAt: string | Date;
}

export interface Listing {
    id: number;
    ownerId?: number;
    owner?: User;

    title: string;
    description: string;
    priceEur: number;
    currency: string;

    city: string;
    neighborhood: string;
    addressText: string;
    lat: number;
    lng: number;

    surfaceSqm: number;
    rooms: number;
    bathrooms?: number;
    floor?: number;
    isFurnished: boolean;
    hasCentralHeating: boolean;
    rentType?: string;
    buildingType?: string;

    // Rules
    petFriendly?: boolean;
    longTermOnly?: boolean;
    genderPreference?: 'female' | 'male' | 'any';

    // Metadata
    status: ListingStatus;
    postedAt: string | Date;
    availableFrom?: string | Date;

    images?: ListingImage[];

    // Computed/joined fields often returned by API
    isFavorite?: boolean;
}
