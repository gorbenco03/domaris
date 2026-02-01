/**
 * 🔒 CONSENT SERVICE - GDPR Consent Tracking
 *
 * Purpose: Manage user consents for GDPR compliance
 * Compliance: GDPR Article 7 (Conditions for consent), Article 13-14 (Information to be provided)
 *
 * Features:
 * - Track mandatory consents (Terms, Privacy, GDPR)
 * - Track optional consents (Marketing, Analytics)
 * - Allow consent withdrawal
 * - Version tracking for legal documents
 * - IP address logging for proof of consent
 */

import { Injectable } from '@nestjs/common';
import { UserConsent, ConsentType } from '../../db/entities/user-consent.entity.js';

// Current versions of legal documents
const CURRENT_VERSIONS = {
  TERMS: '1.0',
  PRIVACY: '1.0',
  GDPR: '1.0',
  MARKETING: '1.0',
  ANALYTICS: '1.0',
};

@Injectable()
export class ConsentService {
  /**
   * Helper: Mask IP address for GDPR compliance
   * 192.168.1.100 → 192.168.1.xxx
   */
  private maskIp(ip: string | undefined): string | undefined {
    if (!ip) return undefined;

    // IPv4: Mask last octet
    if (ip.includes('.') && !ip.includes(':')) {
      const parts = ip.split('.');
      if (parts.length === 4) {
        parts[3] = 'xxx';
        return parts.join('.');
      }
    }

    // IPv6 or other: Mask completely
    return 'xxx.xxx.xxx.xxx';
  }

  /**
   * Record consent during registration
   * Creates consent records for all accepted consents
   */
  async recordConsents(
    userId: number,
    consents: {
      acceptTerms: boolean;
      acceptPrivacy: boolean;
      acceptGdpr: boolean;
      acceptMarketing?: boolean;
      acceptAnalytics?: boolean;
    },
    ipAddress?: string,
    userAgent?: string
  ): Promise<UserConsent[]> {
    const maskedIp = this.maskIp(ipAddress);
    const consentRecords: any[] = [];

    // MANDATORY CONSENTS (must be true)
    if (!consents.acceptTerms || !consents.acceptPrivacy || !consents.acceptGdpr) {
      throw new Error('Mandatory consents (Terms, Privacy, GDPR) must be accepted');
    }

    // Create mandatory consent records
    consentRecords.push({
      userId,
      consentType: ConsentType.TERMS,
      granted: true,
      version: CURRENT_VERSIONS.TERMS,
      grantedAt: new Date(),
      ipAddress: maskedIp,
      userAgent,
    });

    consentRecords.push({
      userId,
      consentType: ConsentType.PRIVACY,
      granted: true,
      version: CURRENT_VERSIONS.PRIVACY,
      grantedAt: new Date(),
      ipAddress: maskedIp,
      userAgent,
    });

    consentRecords.push({
      userId,
      consentType: ConsentType.GDPR,
      granted: true,
      version: CURRENT_VERSIONS.GDPR,
      grantedAt: new Date(),
      ipAddress: maskedIp,
      userAgent,
    });

    // OPTIONAL CONSENTS
    if (consents.acceptMarketing !== undefined) {
      consentRecords.push({
        userId,
        consentType: ConsentType.MARKETING,
        granted: consents.acceptMarketing,
        version: CURRENT_VERSIONS.MARKETING,
        grantedAt: new Date(),
        ipAddress: maskedIp,
        userAgent,
      });
    }

    if (consents.acceptAnalytics !== undefined) {
      consentRecords.push({
        userId,
        consentType: ConsentType.ANALYTICS,
        granted: consents.acceptAnalytics,
        version: CURRENT_VERSIONS.ANALYTICS,
        grantedAt: new Date(),
        ipAddress: maskedIp,
        userAgent,
      });
    }

    // Bulk create all consents
    return UserConsent.bulkCreate(consentRecords);
  }

  /**
   * Withdraw consent (GDPR right to withdraw)
   * Creates a new record with granted=false and withdrawnAt timestamp
   */
  async withdrawConsent(
    userId: number,
    consentType: ConsentType,
    ipAddress?: string,
    userAgent?: string
  ): Promise<UserConsent> {
    // IMPORTANT: Cannot withdraw mandatory consents (Terms, Privacy, GDPR)
    if ([ConsentType.TERMS, ConsentType.PRIVACY, ConsentType.GDPR].includes(consentType)) {
      throw new Error(`Cannot withdraw mandatory consent: ${consentType}. User must delete account instead.`);
    }

    const maskedIp = this.maskIp(ipAddress);

    // Create new withdrawal record (append-only)
    return UserConsent.create({
      userId,
      consentType,
      granted: false,
      version: CURRENT_VERSIONS[consentType],
      grantedAt: new Date(),
      withdrawnAt: new Date(),
      ipAddress: maskedIp,
      userAgent,
    });
  }

  /**
   * Re-grant consent (after withdrawal)
   */
  async grantConsent(
    userId: number,
    consentType: ConsentType,
    ipAddress?: string,
    userAgent?: string
  ): Promise<UserConsent> {
    const maskedIp = this.maskIp(ipAddress);

    return UserConsent.create({
      userId,
      consentType,
      granted: true,
      version: CURRENT_VERSIONS[consentType],
      grantedAt: new Date(),
      ipAddress: maskedIp,
      userAgent,
    });
  }

  /**
   * Get current consent status for a user
   * Returns the LATEST consent record for each consent type
   */
  async getUserConsents(userId: number): Promise<Record<ConsentType, UserConsent | null>> {
    const consents = await UserConsent.findAll({
      where: { userId },
      order: [['grantedAt', 'DESC']],
    });

    // Group by consentType and get latest
    const result: Record<string, UserConsent | null> = {
      [ConsentType.TERMS]: null,
      [ConsentType.PRIVACY]: null,
      [ConsentType.GDPR]: null,
      [ConsentType.MARKETING]: null,
      [ConsentType.ANALYTICS]: null,
    };

    for (const consent of consents) {
      if (!result[consent.consentType]) {
        result[consent.consentType] = consent;
      }
    }

    return result as Record<ConsentType, UserConsent | null>;
  }

  /**
   * Check if user has granted specific consent
   */
  async hasConsent(userId: number, consentType: ConsentType): Promise<boolean> {
    const latest = await UserConsent.findOne({
      where: { userId, consentType },
      order: [['grantedAt', 'DESC']],
    });

    return latest ? latest.isActive() : false;
  }

  /**
   * Get consent history for audit purposes
   */
  async getConsentHistory(userId: number, consentType?: ConsentType): Promise<UserConsent[]> {
    const where: any = { userId };
    if (consentType) {
      where.consentType = consentType;
    }

    return UserConsent.findAll({
      where,
      order: [['grantedAt', 'DESC']],
    });
  }

  /**
   * Validate that user has all mandatory consents
   * Throws error if any mandatory consent is missing or withdrawn
   */
  async validateMandatoryConsents(userId: number): Promise<void> {
    const mandatoryTypes = [ConsentType.TERMS, ConsentType.PRIVACY, ConsentType.GDPR];

    for (const type of mandatoryTypes) {
      const hasIt = await this.hasConsent(userId, type);
      if (!hasIt) {
        throw new Error(`Missing mandatory consent: ${type}`);
      }
    }
  }
}
