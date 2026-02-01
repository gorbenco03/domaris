/**
 * 🔒 AUDIT SERVICE
 *
 * Centralized service for admin action audit logging.
 * Used across all modules that perform admin operations.
 *
 * Usage:
 * ```typescript
 * await this.auditService.log({
 *   adminId: currentUser.id,
 *   adminEmail: currentUser.email,
 *   action: 'USER_DELETE',
 *   targetType: 'User',
 *   targetId: userId,
 *   oldValue: { email: 'user@example.com' },
 *   ipAddress: req.ip,
 * });
 * ```
 */

import { Injectable, Logger } from '@nestjs/common';
import { AdminAuditLog, AdminActionType, AuditTargetType } from '../../db/entities/admin-audit-log.entity.js';
import { User } from '../../db/entities/user.entity.js';

export interface AuditLogDto {
  // WHO
  adminId: number;
  adminEmail: string;
  adminName?: string;

  // WHAT
  action: AdminActionType;
  description?: string;

  // ON WHAT
  targetType?: AuditTargetType;
  targetId?: number;

  // CHANGES
  oldValue?: Record<string, any>;
  newValue?: Record<string, any>;

  // CONTEXT
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  reason?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  /**
   * Mask IP address for GDPR compliance (last octet/segment)
   * IPv4: 192.168.1.xxx
   * IPv6: 2001:0db8:85a3:xxxx:xxxx:xxxx:xxxx:xxxx
   */
  private maskIp(ip: string | undefined): string | undefined {
    if (!ip) return undefined;

    // IPv4
    if (ip.includes('.') && !ip.includes(':')) {
      const parts = ip.split('.');
      if (parts.length === 4) {
        parts[3] = 'xxx';
        return parts.join('.');
      }
    }

    // IPv6
    if (ip.includes(':')) {
      const parts = ip.split(':');
      if (parts.length >= 4) {
        // Mask last 4 segments
        for (let i = parts.length - 4; i < parts.length; i++) {
          parts[i] = 'xxxx';
        }
        return parts.join(':');
      }
    }

    // Fallback: return masked
    return 'xxx.xxx.xxx.xxx';
  }

  /**
   * Sanitize data to remove PII
   * Only keep: IDs, verification levels, flags, metadata
   */
  private sanitizeData(data: Record<string, any> | undefined): Record<string, any> | undefined {
    if (!data) return undefined;

    const sanitized: Record<string, any> = {};

    // Whitelist of allowed non-PII fields
    const allowedFields = [
      'id', 'userId', 'listingId', 'verificationLevel', 'targetLevel',
      'isAdmin', 'status', 'type', 'level', 'role'
    ];

    for (const [key, value] of Object.entries(data)) {
      if (allowedFields.includes(key)) {
        sanitized[key] = value;
      }
      // For other fields, use hash or omit
      else if (key === 'email') {
        // Hash email for identification without storing PII
        const crypto = require('crypto');
        sanitized.emailHash = crypto.createHash('sha256').update(value).digest('hex').substring(0, 16);
      }
    }

    return Object.keys(sanitized).length > 0 ? sanitized : undefined;
  }

  /**
   * Log admin action
   */
  async log(dto: AuditLogDto): Promise<AdminAuditLog> {
    try {
      const auditLog = await AdminAuditLog.create({
        adminId: dto.adminId,
        adminEmail: dto.adminEmail,
        adminName: dto.adminName,
        action: dto.action,
        description: dto.description,
        targetType: dto.targetType,
        targetId: dto.targetId,
        oldValue: this.sanitizeData(dto.oldValue),     // ← SANITIZE PII
        newValue: this.sanitizeData(dto.newValue),     // ← SANITIZE PII
        ipAddress: this.maskIp(dto.ipAddress),         // ← MASK IP
        userAgent: dto.userAgent,
        metadata: dto.metadata,
        reason: dto.reason,
      });

      // Log to console for immediate visibility
      this.logger.log(
        `[AUDIT] ${dto.action} by ${dto.adminEmail} (ID: ${dto.adminId})` +
        (dto.targetType && dto.targetId ? ` on ${dto.targetType}#${dto.targetId}` : '') +
        (dto.reason ? ` - Reason: ${dto.reason}` : '')
      );

      return auditLog;
    } catch (error) {
      // CRITICAL: Audit logging failure should not break the main operation
      // but we must log the error
      this.logger.error(`Failed to create audit log: ${error.message}`, error.stack);
      throw error; // Re-throw to let caller know
    }
  }

  /**
   * Log user deletion
   * NOTE: Only logs non-PII data (userId, level, flags)
   * Email is hashed for identification without storing PII
   */
  async logUserDeletion(
    adminId: number,
    adminEmail: string,
    deletedUser: User,
    ipAddress?: string,
    userAgent?: string,
    reason?: string
  ): Promise<AdminAuditLog> {
    return this.log({
      adminId,
      adminEmail,
      action: 'USER_DELETE',
      targetType: 'User',
      targetId: deletedUser.id,
      oldValue: {
        userId: deletedUser.id,          // ✓ Non-PII
        email: deletedUser.email,        // Will be hashed by sanitizeData()
        verificationLevel: deletedUser.verificationLevel,  // ✓ Non-PII
        isAdmin: deletedUser.isAdmin,    // ✓ Non-PII
      },
      description: `User #${deletedUser.id} deleted`,
      ipAddress,
      userAgent,
      reason,
    });
  }

  /**
   * Log verification level change
   */
  async logVerificationChange(
    adminId: number,
    adminEmail: string,
    userId: number,
    previousLevel: number,
    newLevel: number,
    ipAddress?: string,
    userAgent?: string,
    reason?: string
  ): Promise<AdminAuditLog> {
    return this.log({
      adminId,
      adminEmail,
      action: 'USER_VERIFICATION_CHANGE',
      targetType: 'User',
      targetId: userId,
      oldValue: { verificationLevel: previousLevel },
      newValue: { verificationLevel: newLevel },
      description: `Verification level changed from ${previousLevel} to ${newLevel}`,
      ipAddress,
      userAgent,
      reason,
    });
  }

  /**
   * Log admin privilege grant
   */
  async logAdminGrant(
    adminId: number,
    adminEmail: string,
    targetUserId: number,
    targetUserEmail: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AdminAuditLog> {
    return this.log({
      adminId,
      adminEmail,
      action: 'USER_ADMIN_GRANT',
      targetType: 'User',
      targetId: targetUserId,
      oldValue: { isAdmin: false },
      newValue: { isAdmin: true },
      description: `Admin privileges granted to ${targetUserEmail}`,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Log admin privilege revoke
   */
  async logAdminRevoke(
    adminId: number,
    adminEmail: string,
    targetUserId: number,
    targetUserEmail: string,
    ipAddress?: string,
    userAgent?: string,
    reason?: string
  ): Promise<AdminAuditLog> {
    return this.log({
      adminId,
      adminEmail,
      action: 'USER_ADMIN_REVOKE',
      targetType: 'User',
      targetId: targetUserId,
      oldValue: { isAdmin: true },
      newValue: { isAdmin: false },
      description: `Admin privileges revoked from ${targetUserEmail}`,
      ipAddress,
      userAgent,
      reason,
    });
  }

  /**
   * Log KYC approval
   */
  async logKycApproval(
    adminId: number,
    adminEmail: string,
    kycId: number,
    userId: number,
    targetLevel: number,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AdminAuditLog> {
    return this.log({
      adminId,
      adminEmail,
      action: 'KYC_APPROVE',
      targetType: 'KycVerification',
      targetId: kycId,
      newValue: { status: 'approved', targetLevel },
      description: `KYC approved for user ${userId} to level ${targetLevel}`,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Log KYC rejection
   */
  async logKycRejection(
    adminId: number,
    adminEmail: string,
    kycId: number,
    userId: number,
    reason: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AdminAuditLog> {
    return this.log({
      adminId,
      adminEmail,
      action: 'KYC_REJECT',
      targetType: 'KycVerification',
      targetId: kycId,
      newValue: { status: 'rejected' },
      description: `KYC rejected for user ${userId}`,
      ipAddress,
      userAgent,
      reason,
    });
  }

  /**
   * Log listing status change by admin
   */
  async logListingStatusChange(
    adminId: number,
    adminEmail: string,
    listingId: number,
    oldStatus: string,
    newStatus: string,
    ipAddress?: string,
    userAgent?: string,
    reason?: string
  ): Promise<AdminAuditLog> {
    return this.log({
      adminId,
      adminEmail,
      action: 'LISTING_STATUS_CHANGE',
      targetType: 'Listing',
      targetId: listingId,
      oldValue: { status: oldStatus },
      newValue: { status: newStatus },
      description: `Listing status changed from ${oldStatus} to ${newStatus}`,
      ipAddress,
      userAgent,
      reason,
    });
  }

  /**
   * Log user data export request
   */
  async logDataExport(
    adminId: number,
    adminEmail: string,
    targetUserId: number,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AdminAuditLog> {
    return this.log({
      adminId,
      adminEmail,
      action: 'USER_DATA_EXPORT',
      targetType: 'User',
      targetId: targetUserId,
      description: `Data export requested for user ${targetUserId}`,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Get audit logs (for admin panel)
   */
  async getAuditLogs(params: {
    adminId?: number;
    action?: AdminActionType;
    targetType?: AuditTargetType;
    targetId?: number;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{ rows: AdminAuditLog[]; count: number }> {
    const { Op } = require('sequelize');
    const where: any = {};

    if (params.adminId) where.adminId = params.adminId;
    if (params.action) where.action = params.action;
    if (params.targetType) where.targetType = params.targetType;
    if (params.targetId) where.targetId = params.targetId;

    if (params.startDate || params.endDate) {
      where.createdAt = {};
      if (params.startDate) where.createdAt[Op.gte] = params.startDate;
      if (params.endDate) where.createdAt[Op.lte] = params.endDate;
    }

    return AdminAuditLog.findAndCountAll({
      where,
      limit: params.limit || 50,
      offset: params.offset || 0,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'admin',
          attributes: ['id', 'email', 'firstName', 'lastName'],
        },
      ],
    });
  }
}
