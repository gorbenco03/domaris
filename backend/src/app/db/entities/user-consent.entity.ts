import {
    Table,
    Column,
    Model,
    DataType,
    ForeignKey,
    BelongsTo,
    CreatedAt,
    Index,
} from 'sequelize-typescript';
import { User } from './user.entity.js';

/**
 * GDPR Consent Tracking Entity
 *
 * Purpose: Track user consent for Terms, Privacy Policy, GDPR, Marketing, Analytics
 * Compliance: GDPR Article 7 (Conditions for consent), GDPR Article 13-14 (Information to be provided)
 *
 * Features:
 * - Versioned consents (e.g., Terms v1.0, v2.0)
 * - Withdrawal tracking (withdrawnAt)
 * - IP address logging (for proof of consent)
 * - Append-only (no updates, only new records)
 */

export enum ConsentType {
    TERMS = 'TERMS',                    // Terms & Conditions (mandatory)
    PRIVACY = 'PRIVACY',                // Privacy Policy (mandatory)
    GDPR = 'GDPR',                      // GDPR acceptance (mandatory)
    MARKETING = 'MARKETING',            // Marketing emails (optional)
    ANALYTICS = 'ANALYTICS',            // Analytics tracking (optional)
}

@Table({
    tableName: 'user_consents',
    timestamps: false, // We use custom createdAt, no updatedAt (append-only)
    paranoid: false,   // No soft deletes
})
export class UserConsent extends Model {
    @Column({
        type: DataType.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    })
    id!: number;

    // ============================================================================
    // USER REFERENCE
    // ============================================================================

    @ForeignKey(() => User)
    @Index
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        comment: 'User who gave/withdrew consent',
    })
    userId!: number;

    @BelongsTo(() => User, {
        foreignKey: 'userId',
        onDelete: 'CASCADE', // If user deleted, consents also deleted
    })
    user?: User;

    // ============================================================================
    // CONSENT DETAILS
    // ============================================================================

    @Index
    @Column({
        type: DataType.ENUM(...Object.values(ConsentType)),
        allowNull: false,
        comment: 'Type of consent: TERMS, PRIVACY, GDPR, MARKETING, ANALYTICS',
    })
    consentType!: ConsentType;

    @Column({
        type: DataType.BOOLEAN,
        allowNull: false,
        comment: 'Whether consent was granted (true) or withdrawn (false)',
    })
    granted!: boolean;

    @Column({
        type: DataType.STRING(20),
        allowNull: false,
        comment: 'Version of the consent document (e.g., "1.0", "2.0")',
    })
    version!: string;

    // ============================================================================
    // TIMESTAMPS
    // ============================================================================

    @CreatedAt
    @Index
    @Column({
        type: DataType.DATE,
        allowNull: false,
        defaultValue: DataType.NOW,
        comment: 'When consent was granted',
    })
    grantedAt!: Date;

    @Column({
        type: DataType.DATE,
        allowNull: true,
        comment: 'When consent was withdrawn (null if still active)',
    })
    withdrawnAt?: Date;

    // ============================================================================
    // COMPLIANCE
    // ============================================================================

    @Column({
        type: DataType.STRING(45),
        allowNull: true,
        comment: 'IP address when consent was given (masked: 192.168.1.xxx)',
    })
    ipAddress?: string;

    @Column({
        type: DataType.TEXT,
        allowNull: true,
        comment: 'User agent when consent was given',
    })
    userAgent?: string;

    // ============================================================================
    // HELPER METHODS
    // ============================================================================

    /**
     * Check if consent is currently active (granted and not withdrawn)
     */
    isActive(): boolean {
        return this.granted && !this.withdrawnAt;
    }

    /**
     * Get consent status as string
     */
    getStatus(): 'ACTIVE' | 'WITHDRAWN' | 'DENIED' {
        if (!this.granted) return 'DENIED';
        if (this.withdrawnAt) return 'WITHDRAWN';
        return 'ACTIVE';
    }
}
