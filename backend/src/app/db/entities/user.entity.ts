import { Table, Column, DataType, BeforeCreate, BeforeUpdate } from 'sequelize-typescript';
import { ExtModel } from './extend.model.js';

/**
 * 👤 User Entity - Conform ADR-001: Model de Cont Unificat
 *
 * IMPORTANT: Nu mai folosim "role" pentru acces
 * Accesul este controlat EXCLUSIV de verificationLevel
 *
 * Verification Levels:
 * 0 = Cont nou (acces de bază - căutare, filtre, hartă)
 * 1 = Email/Telefon verificat (acces de bază)
 * 2 = Identitate verificată (poate contacta, programa vizionări)
 * 3 = Proprietar verificat cu documente (POATE POSTA ANUNȚURI)
 */
@Table({
  tableName: 'users',
  underscored: true,
  timestamps: true,
  paranoid: true,
})
export class User extends ExtModel {
  // ============================================================================
  // AUTH FIELDS
  // ============================================================================

  @Column({
    type: DataType.STRING,
    unique: true,
    allowNull: true,
  })
  email?: string | null;

  @Column({
    type: DataType.STRING,
    unique: true,
    allowNull: true,
  })
  phone?: string | null;

  @Column(DataType.STRING)
  password?: string | null;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    unique: true,
  })
  googleId!: string | null;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    unique: true,
  })
  appleId!: string | null;

  // ============================================================================
  // PROFILE FIELDS
  // ============================================================================

  @Column(DataType.STRING)
  firstName?: string;

  @Column(DataType.STRING)
  lastName?: string;

  @Column(DataType.TEXT)
  bio?: string | null;

  @Column(DataType.STRING)
  location?: string | null;

  // Extended address fields - Sprint 1
  @Column(DataType.TEXT)
  address?: string | null;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  city?: string | null;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  country?: string | null;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  postalCode?: string | null;

  @Column(DataType.STRING)
  avatar?: string | null;

  // Social links - Sprint 1
  @Column({
    type: DataType.JSONB,
    defaultValue: {},
  })
  socialLinks!: Record<string, string>;

  // ============================================================================
  // VERIFICATION - ADR-001 CORE
  // ============================================================================

  /**
   * Nivel de verificare - SINGURA "poartă" pentru acces la funcționalități
   *
   * 0 = Cont nou (poate: căutare, filtre, hartă, favorite)
   * 1 = Email/Telefon verificat (+ acces de bază)
   * 2 = Identitate verificată (+ poate contacta, programa vizionări)
   * 3 = Proprietar verificat (+ POATE POSTA ANUNȚURI)
   */
  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 3,
    },
  })
  verificationLevel!: number;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  emailVerified!: boolean;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  phoneVerified!: boolean;

  /**
   * Admin flag - SEPARAT de verification level
   * Admin poate accesa panoul de administrare
   */
  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  isAdmin!: boolean;

  // ============================================================================
  // SUBSCRIPTION
  // ============================================================================

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  hasActiveSubscription!: boolean;

  @Column(DataType.DATE)
  subscriptionExpiresAt!: Date | null;

  // ============================================================================
  // STATS & RATINGS
  // ============================================================================

  @Column({
    type: DataType.FLOAT,
    defaultValue: 0,
  })
  rating!: number;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
  })
  reviewsCount!: number;

  // ============================================================================
  // NOTIFICATION PREFERENCES & QUIET HOURS
  // ============================================================================

  @Column({
    type: DataType.JSONB,
    defaultValue: {
      email: true,
      push: true,
      sms: false,
      marketing: false,
      newMessages: true,
      viewingReminders: true,
      priceDrops: true,
      newListingsAlerts: true,
      quietHoursEnabled: false,
    },
  })
  notificationPreferences!: {
    email: boolean;
    push: boolean;
    sms: boolean;
    marketing: boolean;
    newMessages: boolean;
    viewingReminders: boolean;
    priceDrops: boolean;
    newListingsAlerts: boolean;
    quietHoursEnabled: boolean;
  };

  // Quiet hours for notifications - Sprint 1
  @Column({
    type: DataType.TIME,
    defaultValue: '22:00:00',
  })
  notificationQuietHoursStart!: string;

  @Column({
    type: DataType.TIME,
    defaultValue: '08:00:00',
  })
  notificationQuietHoursEnd!: string;

  // ============================================================================
  // ACTIVITY
  // ============================================================================

  @Column(DataType.DATE)
  lastActiveAt?: Date | null;

  // ============================================================================
  // VIRTUAL FIELDS (computed)
  // ============================================================================

  /**
   * Count of active listings (computed in repository)
   */
  @Column({
    type: DataType.VIRTUAL,
    get() {
      return 0; // Will be set by repository
    },
  })
  activeListingsCount!: number;



  // ============================================================================
  // HOOKS
  // ============================================================================

  @BeforeCreate
  @BeforeUpdate
  static updateVerificationLevel(instance: User) {
    // Auto-update verification level based on verified fields
    if (instance.changed('emailVerified') || instance.changed('phoneVerified')) {
      if ((instance.emailVerified || instance.phoneVerified) && instance.verificationLevel < 1) {
        instance.verificationLevel = 1;
      }
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Verifică dacă utilizatorul poate efectua o acțiune
   */
  canPerformAction(requiredLevel: number): boolean {
    return this.verificationLevel >= requiredLevel;
  }

  /**
   * Verifică dacă utilizatorul poate posta anunțuri
   */
  canPostListings(): boolean {
    return this.verificationLevel >= 3;
  }

  /**
   * Verifică dacă utilizatorul poate contacta alți utilizatori
   */
  canContact(): boolean {
    return this.verificationLevel >= 2;
  }

  /**
   * Returnează badge-ul de verificare
   */
  getVerificationBadge(): string | null {
    switch (this.verificationLevel) {
      case 2:
        return '✓ Verificat';
      case 3:
        return '⭐ Proprietar Verificat';
      default:
        return null;
    }
  }

  /**
   * Returnează datele pentru sesiune (ce trimitem la client)
   */
  toSessionData() {
    return {
      id: this.id,
      email: this.email,
      firstName: this.firstName,
      lastName: this.lastName,
      avatar: this.avatar,
      bio: this.bio,
      address: this.address,
      city: this.city,
      country: this.country,
      postalCode: this.postalCode,
      socialLinks: this.socialLinks,
      verificationLevel: this.verificationLevel,
      isAdmin: this.isAdmin,
      emailVerified: this.emailVerified,
      phoneVerified: this.phoneVerified,
      hasActiveSubscription: this.hasActiveSubscription,
      notificationPreferences: this.notificationPreferences,
      notificationQuietHoursStart: this.notificationQuietHoursStart,
      notificationQuietHoursEnd: this.notificationQuietHoursEnd,
    };
  }

  /**
   * Returnează profilul public (ce văd alții)
   */
  toPublicProfile() {
    return {
      id: this.id,
      firstName: this.firstName,
      lastName: this.lastName ? this.lastName.charAt(0) + '.' : undefined, // Privacy
      avatar: this.avatar,
      bio: this.bio,
      city: this.city,
      country: this.country,
      socialLinks: this.socialLinks,
      verificationLevel: this.verificationLevel,
      rating: this.rating,
      reviewsCount: this.reviewsCount,
      memberSince: this.createdAt,
      isVerified: this.verificationLevel >= 2,
      badges: this.getVerificationBadge() ? [this.getVerificationBadge()!] : [],
    };
  }
}
