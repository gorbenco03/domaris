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
import { Sequelize } from 'sequelize-typescript';
import { InjectConnection } from '@nestjs/sequelize';
import { User } from '../../db/entities/user.entity';
import { KycVerification } from '../../db/entities/kyc-verification.entity';
import { KycDocument } from '../../db/entities/kyc-document.entity';
import { AuditService } from '../../core/audit/audit.service.js';
import { S3Service } from '../../s3/s3.service.js';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class KycService {
  constructor(
    private readonly auditService: AuditService,
    private readonly s3Service: S3Service,
    @InjectConnection() private readonly sequelize: Sequelize,
  ) {}
  /**
   * Încarcă un fișier KYC în DO Spaces cu ACL privat.
   * Returnează key-ul S3 (nu URL public — documentele sunt private).
   */
  private async uploadKycFile(
    file: Express.Multer.File,
    userId: number,
    suffix: string,
  ): Promise<string> {
    const ext = file.originalname.split('.').pop()?.toLowerCase() || 'bin';
    const key = `kyc/${userId}/${uuidv4()}_${suffix}.${ext}`;
    const contentType = file.mimetype || 'application/octet-stream';

    return this.s3Service.uploadPrivateBuffer(file.buffer, key, contentType);
  }

  /**
   * Returns true when KYC_AUTO_APPROVE env variable is set to the string 'true'.
   * Centralised so tests can stub process.env once.
   */
  private isAutoApproveEnabled(): boolean {
    return process.env['KYC_AUTO_APPROVE'] === 'true';
  }

  /**
   * Shared auto-approve transaction: marks verification + docs APPROVED,
   * upgrades user.verificationLevel to Math.max(current, targetLevel).
   * Must be called AFTER the verification record and documents already exist.
   */
  private async runAutoApprove(
    user: User,
    verification: KycVerification,
    targetLevel: number,
  ): Promise<void> {
    await this.sequelize.transaction(async (t) => {
      const reviewedAt = new Date();

      verification.status = 'APPROVED';
      verification.reviewedAt = reviewedAt;
      verification.reviewedBy = null; // system — no admin actor
      verification.rejectionReason = null;
      await verification.save({ transaction: t });

      await KycDocument.update(
        { status: 'APPROVED', reviewedAt },
        { where: { verificationId: verification.id }, transaction: t },
      );

      user.verificationLevel = Math.max(user.verificationLevel, targetLevel);
      await user.save({ transaction: t });
    });
  }

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
      const key = await this.uploadKycFile(files.docFront[0], userId, 'front');
      await KycDocument.create({
        verificationId: verification.id,
        userId,
        type: docType.toUpperCase() as any,
        status: 'PENDING',
        fileUrl: key,
        uploadedAt: now,
      });
    }

    if (files.docBack?.[0]) {
      const key = await this.uploadKycFile(files.docBack[0], userId, 'back');
      await KycDocument.create({
        verificationId: verification.id,
        userId,
        type: docType.toUpperCase() as any,
        status: 'PENDING',
        fileUrl: key,
        uploadedAt: now,
      });
    }

    if (files.selfie?.[0]) {
      const key = await this.uploadKycFile(files.selfie[0], userId, 'selfie');
      await KycDocument.create({
        verificationId: verification.id,
        userId,
        type: 'SELFIE',
        status: 'PENDING',
        fileUrl: key,
        uploadedAt: now,
      });
    }

    console.log(`[KYC] User ${userId} submitted identity verification with ${docType}`);

    // ── AUTO-APPROVE (KYC_AUTO_APPROVE=true) ─────────────────────────────────
    if (this.isAutoApproveEnabled()) {
      await this.runAutoApprove(user, verification, 2);
      console.log(`[KYC][AUTO] User ${userId} auto-approved to level 2`);
      return {
        status: 'APPROVED',
        verificationLevel: user.verificationLevel,
        message: 'Identitate auto-aprobată (modul demo)',
      };
    }

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

    const ownershipKey = await this.uploadKycFile(file, userId, `ownership_${propertyId ?? 'unknown'}`);
    await KycDocument.create({
      verificationId: verification.id,
      userId,
      propertyId: propertyId ?? null,
      type: docType.toUpperCase() as any,
      status: 'PENDING',
      fileUrl: ownershipKey,
      uploadedAt: now,
    });

    console.log(`[KYC] User ${userId} uploaded property document for property ${propertyId}`);

    // ── AUTO-APPROVE (KYC_AUTO_APPROVE=true) ─────────────────────────────────
    if (this.isAutoApproveEnabled()) {
      await this.runAutoApprove(user, verification, 3);
      console.log(`[KYC][AUTO] User ${userId} auto-approved to level 3`);
      return {
        status: 'APPROVED',
        verificationLevel: user.verificationLevel,
        message: 'Document proprietate auto-aprobat (modul demo)',
      };
    }

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

    const targetLevel = verification.targetLevel;

    // Tranzacție DB: verificare + documente + nivel user într-un singur atomic block
    await this.sequelize.transaction(async (t) => {
      const reviewedAt = new Date();

      verification.status = 'APPROVED';
      verification.reviewedAt = reviewedAt;
      verification.reviewedBy = adminId;
      verification.rejectionReason = null;
      await verification.save({ transaction: t });

      await KycDocument.update(
        { status: 'APPROVED', reviewedAt },
        { where: { verificationId: verification.id }, transaction: t },
      );

      user.verificationLevel = Math.max(user.verificationLevel, targetLevel);
      await user.save({ transaction: t });
    });

    // AUDIT LOG (în afara tranzacției — side-effect non-critic)
    await this.auditService.logKycApproval(
      adminId,
      adminEmail,
      verification.id,
      userId,
      targetLevel,
      ipAddress,
      userAgent
    );

    console.log(`[KYC] User ${userId} verified to level ${targetLevel}`);

    return {
      success: true,
      message: `Utilizator verificat la nivelul ${targetLevel}`,
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
