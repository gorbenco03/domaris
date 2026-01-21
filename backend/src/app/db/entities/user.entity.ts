import { Table, Column, DataType, HasMany, BeforeCreate, BeforeUpdate } from 'sequelize-typescript';
import { ExtModel } from './extend.model.js';

/**
 * 👤 User Entity - Conform ADR-001: Model de Cont Unificat
 *
 * IMPORTANT: Nu mai folosim "role" pentru acces
 * Accesul este controlat EXCLUSIV de verificationLevel
 *
 * Verification Levels:
 * 0 = Cont nou (acces de bază - căutare, filtre, hartă)
 * 1 = Email/Telefon verificat (poate contacta, programa vizionări)
 * 2 = Identitate verificată (POATE POSTA ANUNȚURI, KYC complet)
 * 3 = Proprietar verificat cu documente (badge special, promovare)
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
    allowNull: false,
  })
  email!: string;

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

  @Column(DataType.STRING)
  avatar?: string | null;

  // ============================================================================
  // VERIFICATION - ADR-001 CORE
  // ============================================================================

  /**
   * Nivel de verificare - SINGURA "poartă" pentru acces la funcționalități
   *
   * 0 = Cont nou (poate: căutare, filtre, hartă, favorite)
   * 1 = Email/Telefon verificat (+ poate contacta, programa vizionări)
   * 2 = Identitate verificată (+ POATE POSTA ANUNȚURI)
   * 3 = Proprietar verificat (+ badge special, promovare plătită)
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
  // NOTIFICATION PREFERENCES
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
  };

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
  // LEGACY FIELD - TO BE REMOVED AFTER MIGRATION
  // ============================================================================

  /**
   * @deprecated Folosește verificationLevel și isAdmin în loc
   * Păstrat temporar pentru compatibilitate backwards
   * Va fi eliminat după migrarea completă
   */
  @Column({
    type: DataType.ENUM('tenant', 'landlord', 'admin'),
    defaultValue: 'tenant',
    allowNull: true, // Making nullable for gradual migration
  })
  role?: 'tenant' | 'landlord' | 'admin' | null;

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
    return this.verificationLevel >= 2;
  }

  /**
   * Verifică dacă utilizatorul poate contacta alți utilizatori
   */
  canContact(): boolean {
    return this.verificationLevel >= 1;
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
      verificationLevel: this.verificationLevel,
      isAdmin: this.isAdmin,
      emailVerified: this.emailVerified,
      phoneVerified: this.phoneVerified,
      hasActiveSubscription: this.hasActiveSubscription,
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
      verificationLevel: this.verificationLevel,
      rating: this.rating,
      reviewsCount: this.reviewsCount,
      memberSince: this.createdAt,
      isVerified: this.verificationLevel >= 2,
      badges: this.getVerificationBadge() ? [this.getVerificationBadge()!] : [],
    };
  }
}
