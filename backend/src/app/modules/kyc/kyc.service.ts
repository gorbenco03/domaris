/**
 * 🔍 KYC SERVICE - Know Your Customer (Verificare Identitate)
 *
 * Conform ADR-001: Model de Cont Unificat
 * Gestionează verificarea identității și actualizarea verificationLevel
 *
 * Verification Levels:
 * 0 = Cont nou
 * 1 = Email/Telefon verificat
 * 2 = Identitate verificată (KYC complet) - POATE POSTA
 * 3 = Proprietar verificat cu documente
 */

import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { User } from '../../db/entities/user.entity';

// Types
export interface KycDocument {
  id: string;
  userId: number;
  type: 'ID_CARD' | 'PASSPORT' | 'DRIVING_LICENSE' | 'PROPERTY_DEED' | 'UTILITY_BILL' | 'SELFIE';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  fileUrl?: string;
  uploadedAt: Date;
  reviewedAt?: Date;
  rejectionReason?: string;
}

export interface KycVerification {
  id: string;
  userId: number;
  status: 'NOT_STARTED' | 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  targetLevel: number;
  submittedAt?: Date;
  reviewedAt?: Date;
  rejectionReason?: string;
  documents: KycDocument[];
  expiresAt?: Date;
}

// In-memory storage for demo (replace with DB in production)
const kycVerifications: Map<number, KycVerification> = new Map();
const kycDocuments: KycDocument[] = [];

@Injectable()
export class KycService {
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
      return {
        success: true,
        message: 'Identitatea este deja verificată',
        currentLevel: user.verificationLevel,
      };
    }

    // Check if there's a pending verification
    const existing = kycVerifications.get(userId);
    if (existing && existing.status === 'PENDING') {
      throw new BadRequestException({
        code: 'KYC_PENDING',
        message: 'Ai deja o verificare în curs. Așteaptă rezultatul.',
      });
    }

    // Create documents
    const documents: KycDocument[] = [];
    const now = new Date();

    if (files.docFront?.[0]) {
      documents.push({
        id: `doc_${Date.now()}_front`,
        userId,
        type: docType.toUpperCase() as any,
        status: 'PENDING',
        // In production: upload to S3 and store URL
        fileUrl: `uploads/kyc/${userId}/${Date.now()}_front.jpg`,
        uploadedAt: now,
      });
      kycDocuments.push(documents[documents.length - 1]);
    }

    if (files.docBack?.[0]) {
      documents.push({
        id: `doc_${Date.now()}_back`,
        userId,
        type: docType.toUpperCase() as any,
        status: 'PENDING',
        fileUrl: `uploads/kyc/${userId}/${Date.now()}_back.jpg`,
        uploadedAt: now,
      });
      kycDocuments.push(documents[documents.length - 1]);
    }

    if (files.selfie?.[0]) {
      documents.push({
        id: `doc_${Date.now()}_selfie`,
        userId,
        type: 'SELFIE',
        status: 'PENDING',
        fileUrl: `uploads/kyc/${userId}/${Date.now()}_selfie.jpg`,
        uploadedAt: now,
      });
      kycDocuments.push(documents[documents.length - 1]);
    }

    // Create verification record
    const verification: KycVerification = {
      id: `kyc_${Date.now()}`,
      userId,
      status: 'PENDING',
      targetLevel: 2,
      submittedAt: now,
      documents,
      expiresAt: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000), // 1 year
    };

    kycVerifications.set(userId, verification);

    console.log(`[KYC] User ${userId} submitted identity verification with ${docType}`);

    return {
      success: true,
      verificationId: verification.id,
      status: verification.status,
      message: 'Documente primite. Verificarea este în curs.',
      estimatedTime: '24-48 ore',
    };
  }

  /**
   * Get KYC status for user
   */
  async getStatus(userId: number) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new NotFoundException('Utilizator negăsit');
    }

    const verification = kycVerifications.get(userId);

    return {
      userId,
      currentLevel: user.verificationLevel,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      
      // Verification process status
      verification: verification
        ? {
            id: verification.id,
            status: verification.status,
            targetLevel: verification.targetLevel,
            submittedAt: verification.submittedAt,
            reviewedAt: verification.reviewedAt,
            rejectionReason: verification.rejectionReason,
            documentsCount: verification.documents.length,
            canResubmit: verification.status === 'REJECTED',
            expiresAt: verification.expiresAt,
          }
        : null,

      // What user can do
      permissions: {
        canBrowse: true,
        canSearch: true,
        canAddFavorites: true,
        canContact: user.verificationLevel >= 1,
        canRequestViewing: user.verificationLevel >= 1,
        canPostListing: user.verificationLevel >= 2,
        canBoostListing: user.verificationLevel >= 3,
      },

      // Next steps
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
      steps.push('Verifică-ți identitatea pentru a posta anunțuri');
    }

    if (user.verificationLevel === 2) {
      steps.push('Adaugă documente de proprietate pentru badge-ul de proprietar verificat');
    }

    return steps;
  }

  /**
   * Upload property ownership document (pentru nivel 3)
   */
  async verifyProperty(
    userId: number,
    propertyId: number,
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

    if (!file) {
      throw new BadRequestException('Fișierul este obligatoriu');
    }

    const document: KycDocument = {
      id: `doc_property_${Date.now()}`,
      userId,
      type: docType.toUpperCase() as any,
      status: 'PENDING',
      fileUrl: `uploads/kyc/${userId}/property_${propertyId}_${Date.now()}.pdf`,
      uploadedAt: new Date(),
    };

    kycDocuments.push(document);

    console.log(`[KYC] User ${userId} uploaded property document for property ${propertyId}`);

    return {
      success: true,
      documentId: document.id,
      status: 'PENDING',
      message: 'Document de proprietate încarcat. Verificarea este în curs.',
    };
  }

  // ============================================================================
  // ADMIN METHODS (pentru procesare manuală/automată)
  // ============================================================================

  /**
   * Approve KYC verification (called by admin or automated system)
   */
  async approveVerification(userId: number) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new NotFoundException('Utilizator negăsit');
    }

    const verification = kycVerifications.get(userId);
    if (!verification) {
      throw new NotFoundException('Verificare negăsită');
    }

    // Update verification
    verification.status = 'APPROVED';
    verification.reviewedAt = new Date();

    // Update documents
    verification.documents.forEach((doc) => {
      doc.status = 'APPROVED';
      doc.reviewedAt = new Date();
    });

    // Update user level
    user.verificationLevel = verification.targetLevel;
    await user.save();

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
  async rejectVerification(userId: number, reason: string) {
    const verification = kycVerifications.get(userId);
    if (!verification) {
      throw new NotFoundException('Verificare negăsită');
    }

    verification.status = 'REJECTED';
    verification.reviewedAt = new Date();
    verification.rejectionReason = reason;

    // Update documents
    verification.documents.forEach((doc) => {
      doc.status = 'REJECTED';
      doc.reviewedAt = new Date();
      doc.rejectionReason = reason;
    });

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
    const pending: KycVerification[] = [];
    kycVerifications.forEach((v) => {
      if (v.status === 'PENDING') {
        pending.push(v);
      }
    });
    return pending;
  }
}
