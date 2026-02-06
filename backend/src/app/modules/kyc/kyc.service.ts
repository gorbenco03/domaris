/**
 * 🔍 KYC SERVICE - Know Your Customer (Verificare Identitate)
 *
 * Conform ADR-001: Model de Cont Unificat
 * Gestionează verificarea identității și actualizarea verificationLevel
 *
 * Verification Levels:
 * 0 = Cont nou
 * 1 = Email/Telefon verificat
 * 2 = Identitate verificată (poate contacta/programează vizionări)
 * 3 = Proprietar verificat cu documente (POATE POSTA)
 */

import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Op } from 'sequelize';
import { User } from '../../db/entities/user.entity';
import { KycVerification } from '../../db/entities/kyc-verification.entity';
import { KycDocument } from '../../db/entities/kyc-document.entity';
import { AuditService } from '../../core/audit/audit.service.js';

@Injectable()
export class KycService {
  constructor(private readonly auditService: AuditService) {}
  private async getVerification(userId: number) {
    return KycVerification.findOne({
      where: { userId },
      include: [KycDocument],
    });
  }

  private buildStatusResponse(user: User, verification: KycVerification | null) {
    const effectiveStatus =
      verification?.status ||
      (user.verificationLevel >= 2 ? 'APPROVED' : 'NOT_STARTED');
    const effectiveTargetLevel =
      verification?.targetLevel ||
      (user.verificationLevel >= 3
        ? 3
        : user.verificationLevel >= 2
        ? 2
        : null);

    return {
      userId: String(user.id),
      status: effectiveStatus,
      currentLevel: user.verificationLevel,
      targetLevel: effectiveTargetLevel,
      submittedAt: verification?.submittedAt ?? null,
      reviewedAt: verification?.reviewedAt ?? null,
      rejectionReason: verification?.rejectionReason ?? null,
      documents:
        verification?.documents?.map((doc) => ({
          id: String(doc.id),
          type: doc.type,
          status: doc.status,
          uploadedAt: doc.uploadedAt,
          reviewedAt: doc.reviewedAt ?? null,
          rejectionReason: doc.rejectionReason ?? null,
        })) ?? [],
      canResubmit: effectiveStatus === 'REJECTED',
      expiresAt: verification?.expiresAt ?? null,
    };
  }

  /**
   * Start identity verification process (pentru nivel 2)
   */
  async startIdVerification(
    userId: number,
    docType: string,
    files: {
      docFront?: Express.Multer.File[];
      docBack?: Express.Multer.File[];
      selfie?: Express.Multer.File[];
    },
  ) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new NotFoundException('Utilizator negăsit');
    }

    // Check if user already has level 2+
    if (user.verificationLevel >= 2) {
      return this.getStatus(userId);
    }

    const existing = await this.getVerification(userId);
    if (existing && ['PENDING', 'IN_REVIEW'].includes(existing.status)) {
      throw new BadRequestException({
        code: 'KYC_PENDING',
        message: 'Ai deja o verificare în curs. Așteaptă rezultatul.',
      });
    }

    const now = new Date();
    let verification = existing;

    if (verification) {
      verification.status = 'PENDING';
      verification.targetLevel = 2;
      verification.submittedAt = now;
      verification.reviewedAt = null;
      verification.reviewedBy = null;
      verification.rejectionReason = null;
      verification.expiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
      await verification.save();
      await KycDocument.destroy({ where: { verificationId: verification.id } });
    } else {
      verification = await KycVerification.create({
        userId,
        status: 'PENDING',
        targetLevel: 2,
        provider: 'MANUAL',
        submittedAt: now,
        expiresAt: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000),
      });
    }

    if (files.docFront?.[0]) {
      await KycDocument.create({
        verificationId: verification.id,
        userId,
        type: docType.toUpperCase() as any,
        status: 'PENDING',
        // In production: upload to DigitalOcean Spaces and store URL
        fileUrl: `uploads/kyc/${userId}/${Date.now()}_front.jpg`,
        uploadedAt: now,
      });
    }

    if (files.docBack?.[0]) {
      await KycDocument.create({
        verificationId: verification.id,
        userId,
        type: docType.toUpperCase() as any,
        status: 'PENDING',
        fileUrl: `uploads/kyc/${userId}/${Date.now()}_back.jpg`,
        uploadedAt: now,
      });
    }

    if (files.selfie?.[0]) {
      await KycDocument.create({
        verificationId: verification.id,
        userId,
        type: 'SELFIE',
        status: 'PENDING',
        fileUrl: `uploads/kyc/${userId}/${Date.now()}_selfie.jpg`,
        uploadedAt: now,
      });
    }

    console.log(`[KYC] User ${userId} submitted identity verification with ${docType}`);

    return this.getStatus(userId);
  }

  /**
   * Get KYC status for user
   */
  async getStatus(userId: number) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new NotFoundException('Utilizator negăsit');
    }

    const verification = await this.getVerification(userId);

    return {
      ...this.buildStatusResponse(user, verification),
      permissions: {
        canBrowse: true,
        canSearch: true,
        canAddFavorites: true,
        canContact: user.verificationLevel >= 2,
        canRequestViewing: user.verificationLevel >= 2,
        canPostListing: user.verificationLevel >= 3,
        canBoostListing: user.verificationLevel >= 3,
      },
      nextSteps: this.getNextSteps(user),
    };
  }

  /**
   * Get next steps for user to increase verification level
   */
  private getNextSteps(user: User): string[] {
    const steps: string[] = [];

    if (!user.emailVerified && !user.phoneVerified) {
      steps.push('Verifică email-ul sau telefonul pentru a contacta proprietari');
    }

    if (user.verificationLevel < 2) {
      steps.push('Verifică-ți identitatea pentru a putea contacta proprietari');
    }

    if (user.verificationLevel === 2) {
      steps.push('Adaugă documente de proprietate pentru a putea posta anunțuri');
    }

    return steps;
  }

  /**
   * Upload property ownership document (pentru nivel 3)
   */
  async verifyProperty(
    userId: number,
    propertyId: number | undefined,
    docType: string,
    file: Express.Multer.File | undefined,
  ) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new NotFoundException('Utilizator negăsit');
    }

    if (user.verificationLevel < 2) {
      throw new BadRequestException({
        code: 'KYC_REQUIRED',
        message: 'Trebuie să îți verifici identitatea înainte de a adăuga documente de proprietate',
      });
    }

    if (user.verificationLevel >= 3) {
      return this.getStatus(userId);
    }

    if (!file) {
      throw new BadRequestException('Fișierul este obligatoriu');
    }

    const existing = await this.getVerification(userId);
    if (existing && ['PENDING', 'IN_REVIEW'].includes(existing.status)) {
      throw new BadRequestException({
        code: 'KYC_PENDING',
        message: 'Ai deja o verificare în curs. Așteaptă rezultatul.',
      });
    }

    const now = new Date();
    let verification = existing;

    if (verification) {
      verification.status = 'PENDING';
      verification.targetLevel = 3;
      verification.submittedAt = now;
      verification.reviewedAt = null;
      verification.reviewedBy = null;
      verification.rejectionReason = null;
      verification.expiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
      await verification.save();
      await KycDocument.destroy({ where: { verificationId: verification.id } });
    } else {
      verification = await KycVerification.create({
        userId,
        status: 'PENDING',
        targetLevel: 3,
        provider: 'MANUAL',
        submittedAt: now,
        expiresAt: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000),
      });
    }

    await KycDocument.create({
      verificationId: verification.id,
      userId,
      propertyId: propertyId ?? null,
      type: docType.toUpperCase() as any,
      status: 'PENDING',
      fileUrl: `uploads/kyc/${userId}/ownership_${propertyId ?? 'unknown'}_${Date.now()}.pdf`,
      uploadedAt: now,
    });

    console.log(`[KYC] User ${userId} uploaded property document for property ${propertyId}`);

    return this.getStatus(userId);
  }

  // ============================================================================
  // ADMIN METHODS (pentru procesare manuală/automată)
  // ============================================================================

  /**
   * Approve KYC verification (called by admin or automated system)
   */
  async approveVerification(
    userId: number,
    adminId: number,
    adminEmail: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new NotFoundException('Utilizator negăsit');
    }

    const verification = await this.getVerification(userId);
    if (!verification) {
      throw new NotFoundException('Verificare negăsită');
    }

    // Update verification
    verification.status = 'APPROVED';
    verification.reviewedAt = new Date();
    verification.reviewedBy = adminId;
    verification.rejectionReason = null;
    await verification.save();

    await KycDocument.update(
      { status: 'APPROVED', reviewedAt: verification.reviewedAt },
      { where: { verificationId: verification.id } },
    );

    // Update user level
    user.verificationLevel = Math.max(user.verificationLevel, verification.targetLevel);
    await user.save();

    // AUDIT LOG
    await this.auditService.logKycApproval(
      adminId,
      adminEmail,
      verification.id,
      userId,
      verification.targetLevel,
      ipAddress,
      userAgent
    );

    console.log(`[KYC] User ${userId} verified to level ${verification.targetLevel}`);

    return {
      success: true,
      message: `Utilizator verificat la nivelul ${verification.targetLevel}`,
      newLevel: user.verificationLevel,
    };
  }

  /**
   * Reject KYC verification
   */
  async rejectVerification(
    userId: number,
    reason: string,
    adminId: number,
    adminEmail: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    // VALIDATION: Reason is REQUIRED for KYC rejection (compliance)
    if (!reason || reason.trim().length === 0) {
      throw new BadRequestException({
        code: 'REASON_REQUIRED',
        message: 'Reason is required for KYC rejection'
      });
    }

    const verification = await this.getVerification(userId);
    if (!verification) {
      throw new NotFoundException('Verificare negăsită');
    }

    verification.status = 'REJECTED';
    verification.reviewedAt = new Date();
    verification.reviewedBy = adminId;
    verification.rejectionReason = reason;
    await verification.save();

    await KycDocument.update(
      {
        status: 'REJECTED',
        reviewedAt: verification.reviewedAt,
        rejectionReason: reason,
      },
      { where: { verificationId: verification.id } },
    );

    // AUDIT LOG
    await this.auditService.logKycRejection(
      adminId,
      adminEmail,
      verification.id,
      userId,
      reason,
      ipAddress,
      userAgent
    );

    console.log(`[KYC] User ${userId} verification rejected: ${reason}`);

    return {
      success: true,
      message: 'Verificare respinsă',
      reason,
    };
  }

  /**
   * Get all pending verifications (for admin)
   */
  async getPendingVerifications() {
    return KycVerification.findAll({
      where: { status: { [Op.in]: ['PENDING', 'IN_REVIEW'] } },
      include: [KycDocument],
      order: [['submittedAt', 'ASC']],
    });
  }
}
