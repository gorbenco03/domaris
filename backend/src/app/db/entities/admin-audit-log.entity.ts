/**
 * 🔒 ADMIN AUDIT LOG ENTITY
 *
 * Înregistrează TOATE acțiunile administrative pentru compliance și securitate.
 *
 * GDPR/Compliance Requirements:
 * - Moldova Law 133/2011 (Personal Data Protection)
 * - GDPR Article 30 (Records of Processing Activities)
 * - Retention: Minimum 90 days, recommended 1 year
 *
 * Security Requirements:
 * - Immutable (nu poate fi modificat/șters)
 * - Timestamps automate
 * - IP și User Agent pentru context
 * - Referință la admin și target
 *
 * Use Cases:
 * - Audit trail pentru inspectori GDPR
 * - Insider threat detection
 * - Investigații de securitate
 * - Demonstrare compliance
 */

import {
  Table,
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
  CreatedAt,
} from 'sequelize-typescript';
import { ApiProperty } from '@nestjs/swagger';
import { ExtModel } from './extend.model.js';
import { User } from './user.entity.js';

/**
 * Admin action types - toate acțiunile care necesită audit
 */
export type AdminActionType =
  // User management
  | 'USER_DELETE'           // Admin șterge cont user
  | 'USER_VERIFICATION_CHANGE' // Admin modifică nivel verificare
  | 'USER_ADMIN_GRANT'      // Admin acordă privilegii admin altcuiva
  | 'USER_ADMIN_REVOKE'     // Admin revocă privilegii admin
  | 'USER_BAN'              // Admin blochează user
  | 'USER_UNBAN'            // Admin deblochează user

  // KYC management
  | 'KYC_APPROVE'           // Admin aprobă verificare KYC
  | 'KYC_REJECT'            // Admin respinge verificare KYC
  | 'KYC_DOCUMENT_VIEW'     // Admin vizualizează document KYC (sensitive)

  // Listing management
  | 'LISTING_STATUS_CHANGE' // Admin modifică status anunț
  | 'LISTING_DELETE'        // Admin șterge anunț
  | 'LISTING_FEATURE'       // Admin promovează anunț manual

  // Data access (GDPR compliance)
  | 'USER_DATA_EXPORT'      // Admin exportă date user
  | 'USER_DATA_VIEW'        // Admin accesează profil complet user
  | 'MESSAGES_VIEW'         // Admin accesează conversații (support)

  // System
  | 'SETTINGS_CHANGE'       // Admin modifică setări sistem
  | 'ADMIN_LOGIN'           // Admin login (security monitoring)
  | 'ADMIN_LOGOUT';         // Admin logout

/**
 * Target types - ce tip de resurse a fost afectat
 */
export type AuditTargetType = 'User' | 'Listing' | 'KycVerification' | 'Message' | 'System';

@Table({
  tableName: 'admin_audit_logs',
  timestamps: true,
  updatedAt: false, // IMMUTABLE - nu poate fi modificat
  paranoid: false,  // IMMUTABLE - nu poate fi soft-deleted
})
export class AdminAuditLog extends ExtModel {
  @ApiProperty({ description: 'ID unic audit log' })
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  id!: number;

  // ============================================================================
  // ADMIN INFO (WHO)
  // ============================================================================

  @ApiProperty({ description: 'ID admin care a executat acțiunea' })
  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  adminId!: number;

  @BelongsTo(() => User, 'adminId')
  admin?: User;

  @ApiProperty({ description: 'Email admin (pentru identificare rapidă)' })
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  adminEmail!: string;

  @ApiProperty({ description: 'Nume complet admin (snapshot)' })
  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  adminName?: string;

  // ============================================================================
  // ACTION INFO (WHAT)
  // ============================================================================

  @ApiProperty({
    description: 'Tipul acțiunii administrative',
    enum: [
      'USER_DELETE', 'USER_VERIFICATION_CHANGE', 'USER_ADMIN_GRANT', 'USER_ADMIN_REVOKE',
      'USER_BAN', 'USER_UNBAN', 'KYC_APPROVE', 'KYC_REJECT', 'KYC_DOCUMENT_VIEW',
      'LISTING_STATUS_CHANGE', 'LISTING_DELETE', 'LISTING_FEATURE',
      'USER_DATA_EXPORT', 'USER_DATA_VIEW', 'MESSAGES_VIEW',
      'SETTINGS_CHANGE', 'ADMIN_LOGIN', 'ADMIN_LOGOUT'
    ]
  })
  @Column({
    type: DataType.STRING(50),
    allowNull: false,
  })
  action!: AdminActionType;

  @ApiProperty({ description: 'Descriere human-readable a acțiunii' })
  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  description?: string;

  // ============================================================================
  // TARGET INFO (ON WHAT)
  // ============================================================================

  @ApiProperty({
    description: 'Tipul resursei afectate',
    enum: ['User', 'Listing', 'KycVerification', 'Message', 'System']
  })
  @Column({
    type: DataType.STRING(50),
    allowNull: true, // Null pentru acțiuni de sistem (ADMIN_LOGIN, etc.)
  })
  targetType?: AuditTargetType;

  @ApiProperty({ description: 'ID resursei afectate' })
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  targetId?: number;

  // ============================================================================
  // CHANGES (BEFORE/AFTER for compliance)
  // ============================================================================

  @ApiProperty({
    description: 'Valoarea anterioară (JSON)',
    example: '{"verificationLevel": 2, "isAdmin": false}'
  })
  @Column({
    type: DataType.JSONB,
    allowNull: true,
  })
  oldValue?: Record<string, any>;

  @ApiProperty({
    description: 'Valoarea nouă (JSON)',
    example: '{"verificationLevel": 3, "isAdmin": false}'
  })
  @Column({
    type: DataType.JSONB,
    allowNull: true,
  })
  newValue?: Record<string, any>;

  // ============================================================================
  // CONTEXT (WHERE, WHEN, HOW)
  // ============================================================================

  @ApiProperty({ description: 'IP address admin (security)' })
  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  ipAddress?: string;

  @ApiProperty({ description: 'User Agent (browser/device info)' })
  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  userAgent?: string;

  @ApiProperty({ description: 'Metadata adițională (JSON)' })
  @Column({
    type: DataType.JSONB,
    allowNull: true,
  })
  metadata?: Record<string, any>;

  @ApiProperty({ description: 'Motivul acțiunii (pentru REJECT, DELETE, etc.)' })
  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  reason?: string;

  // ============================================================================
  // TIMESTAMPS (WHEN)
  // ============================================================================

  @ApiProperty({ description: 'Când a fost executată acțiunea' })
  @CreatedAt
  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  createdAt!: Date;

  // NO updatedAt - logs are IMMUTABLE
  // NO deletedAt - logs cannot be deleted
}
