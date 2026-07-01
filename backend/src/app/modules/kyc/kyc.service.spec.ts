/**
 * KycService tests
 * Tests: approveVerification (level update, audit log, transaction),
 *        rejectVerification (reason required, status update),
 *        getStatus (permissions map), startIdVerification (duplicate pending check),
 *        verifyProperty (requires level 2)
 */

// Must mock uuid before importing anything that uses it (uuid@13 is ESM-only)
jest.mock('uuid', () => ({ v4: () => 'mock-uuid-1234' }));

// Mock the S3 service entirely (pulls in aws-sdk + uuid)
jest.mock('../../s3/s3.service.js', () => ({
  S3Service: jest.fn(),
}));

import { BadRequestException, NotFoundException } from '@nestjs/common';

// ─── Mock entities and services ──────────────────────────────────────────────

const mockUserFindByPk = jest.fn();
const mockUserSave = jest.fn().mockResolvedValue(undefined);

jest.mock('../../db/entities/user.entity', () => ({
  User: {
    findByPk: (...args: any[]) => mockUserFindByPk(...args),
  },
}));

const mockVerificationFindOne = jest.fn();
const mockVerificationCreate = jest.fn();
const mockVerificationSave = jest.fn().mockResolvedValue(undefined);

jest.mock('../../db/entities/kyc-verification.entity', () => ({
  KycVerification: {
    findOne: (...args: any[]) => mockVerificationFindOne(...args),
    findAll: jest.fn().mockResolvedValue([]),
    create: (...args: any[]) => mockVerificationCreate(...args),
  },
}));

const mockDocumentCreate = jest.fn().mockResolvedValue({});
const mockDocumentUpdate = jest.fn().mockResolvedValue([1]);
const mockDocumentDestroy = jest.fn().mockResolvedValue(1);

jest.mock('../../db/entities/kyc-document.entity', () => ({
  KycDocument: {
    create: (...args: any[]) => mockDocumentCreate(...args),
    update: (...args: any[]) => mockDocumentUpdate(...args),
    destroy: (...args: any[]) => mockDocumentDestroy(...args),
  },
}));

// ─── Mock services ────────────────────────────────────────────────────────────

const mockAuditService = {
  log: jest.fn().mockResolvedValue(undefined),
  logKycApproval: jest.fn().mockResolvedValue(undefined),
  logKycRejection: jest.fn().mockResolvedValue(undefined),
};

const mockS3Service = {
  uploadPrivateBuffer: jest.fn().mockResolvedValue('kyc/1/uuid_front.jpg'),
};

// ─── Mock Sequelize transaction ───────────────────────────────────────────────

const mockTransaction = {
  commit: jest.fn(),
  rollback: jest.fn(),
};

const mockSequelize = {
  transaction: jest.fn().mockImplementation(async (cb: Function) => {
    return cb(mockTransaction);
  }),
};

// ─── Import after mocks ────────────────────────────────────────────────────────

import { KycService } from './kyc.service';

// ─── Builder helpers ──────────────────────────────────────────────────────────

function buildUser(overrides: Partial<any> = {}): any {
  return {
    id: 1,
    verificationLevel: 1,
    emailVerified: true,
    phoneVerified: false,
    save: mockUserSave,
    ...overrides,
  };
}

function buildVerification(overrides: Partial<any> = {}): any {
  return {
    id: 100,
    userId: 1,
    status: 'PENDING',
    targetLevel: 2,
    documents: [],
    save: mockVerificationSave,
    ...overrides,
  };
}

// ─── Suite ───────────────────────────────────────────────────────────────────

describe('KycService', () => {
  let service: KycService;

  beforeEach(() => {
    service = new KycService(
      mockAuditService as any,
      mockS3Service as any,
      mockSequelize as any,
    );
    jest.clearAllMocks();
  });

  // ─── approveVerification ─────────────────────────────────────────────────

  describe('approveVerification', () => {
    it('throws NotFoundException when user not found', async () => {
      mockUserFindByPk.mockResolvedValue(null);
      await expect(
        service.approveVerification(999, 1, 'admin@test.com'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when verification not found', async () => {
      mockUserFindByPk.mockResolvedValue(buildUser());
      mockVerificationFindOne.mockResolvedValue(null);

      await expect(
        service.approveVerification(1, 1, 'admin@test.com'),
      ).rejects.toThrow(NotFoundException);
    });

    it('sets verification status to APPROVED inside transaction', async () => {
      const user = buildUser({ verificationLevel: 1 });
      const verification = buildVerification({ targetLevel: 2 });

      mockUserFindByPk.mockResolvedValue(user);
      mockVerificationFindOne.mockResolvedValue(verification);

      await service.approveVerification(1, 7, 'admin@test.com');

      expect(verification.status).toBe('APPROVED');
      expect(verification.reviewedBy).toBe(7);
      expect(verification.rejectionReason).toBeNull();
    });

    it('updates user.verificationLevel to targetLevel', async () => {
      const user = buildUser({ verificationLevel: 1 });
      const verification = buildVerification({ targetLevel: 2 });

      mockUserFindByPk.mockResolvedValue(user);
      mockVerificationFindOne.mockResolvedValue(verification);

      await service.approveVerification(1, 7, 'admin@test.com');

      // verificationLevel should be max(1, 2) = 2
      expect(user.verificationLevel).toBe(2);
    });

    it('does NOT downgrade verificationLevel if already higher', async () => {
      const user = buildUser({ verificationLevel: 3 });
      const verification = buildVerification({ targetLevel: 2 });

      mockUserFindByPk.mockResolvedValue(user);
      mockVerificationFindOne.mockResolvedValue(verification);

      await service.approveVerification(1, 7, 'admin@test.com');

      // max(3, 2) = 3 — should not be downgraded
      expect(user.verificationLevel).toBe(3);
    });

    it('calls auditService.logKycApproval', async () => {
      const user = buildUser();
      const verification = buildVerification({ targetLevel: 2 });

      mockUserFindByPk.mockResolvedValue(user);
      mockVerificationFindOne.mockResolvedValue(verification);

      await service.approveVerification(1, 7, 'admin@test.com', '1.2.3.4');

      expect(mockAuditService.logKycApproval).toHaveBeenCalledWith(
        7,
        'admin@test.com',
        verification.id,
        1,
        2,
        '1.2.3.4',
        undefined,
      );
    });

    it('updates KycDocuments to APPROVED inside transaction', async () => {
      const user = buildUser();
      const verification = buildVerification({ targetLevel: 2 });

      mockUserFindByPk.mockResolvedValue(user);
      mockVerificationFindOne.mockResolvedValue(verification);

      await service.approveVerification(1, 7, 'admin@test.com');

      expect(mockDocumentUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'APPROVED' }),
        expect.objectContaining({ where: { verificationId: verification.id } }),
      );
    });

    it('returns success with newLevel', async () => {
      const user = buildUser({ verificationLevel: 1 });
      const verification = buildVerification({ targetLevel: 2 });

      mockUserFindByPk.mockResolvedValue(user);
      mockVerificationFindOne.mockResolvedValue(verification);

      const result = await service.approveVerification(1, 7, 'admin@test.com');

      expect(result.success).toBe(true);
      expect(result.newLevel).toBe(2);
    });
  });

  // ─── rejectVerification ───────────────────────────────────────────────────

  describe('rejectVerification', () => {
    it('throws BadRequestException REASON_REQUIRED when reason is empty', async () => {
      await expect(
        service.rejectVerification(1, '', 7, 'admin@test.com'),
      ).rejects.toThrow(BadRequestException);

      try {
        await service.rejectVerification(1, '', 7, 'admin@test.com');
      } catch (e: any) {
        expect(e.response?.code).toBe('REASON_REQUIRED');
      }
    });

    it('throws BadRequestException when reason is only whitespace', async () => {
      await expect(
        service.rejectVerification(1, '   ', 7, 'admin@test.com'),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException when verification not found', async () => {
      mockVerificationFindOne.mockResolvedValue(null);

      await expect(
        service.rejectVerification(1, 'Documents invalid', 7, 'admin@test.com'),
      ).rejects.toThrow(NotFoundException);
    });

    it('sets verification status to REJECTED with reason', async () => {
      const verification = buildVerification({ status: 'PENDING' });
      mockVerificationFindOne.mockResolvedValue(verification);

      await service.rejectVerification(1, 'Blurry photo', 7, 'admin@test.com');

      expect(verification.status).toBe('REJECTED');
      expect(verification.rejectionReason).toBe('Blurry photo');
      expect(verification.reviewedBy).toBe(7);
    });

    it('updates KycDocuments to REJECTED with reason', async () => {
      const verification = buildVerification();
      mockVerificationFindOne.mockResolvedValue(verification);

      await service.rejectVerification(1, 'Bad image', 7, 'admin@test.com');

      expect(mockDocumentUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'REJECTED',
          rejectionReason: 'Bad image',
        }),
        expect.objectContaining({ where: { verificationId: verification.id } }),
      );
    });

    it('calls auditService.logKycRejection', async () => {
      const verification = buildVerification();
      mockVerificationFindOne.mockResolvedValue(verification);

      await service.rejectVerification(1, 'Invalid docs', 7, 'admin@test.com', '5.6.7.8');

      expect(mockAuditService.logKycRejection).toHaveBeenCalledWith(
        7,
        'admin@test.com',
        verification.id,
        1,
        'Invalid docs',
        '5.6.7.8',
        undefined,
      );
    });

    it('returns success with reason', async () => {
      const verification = buildVerification();
      mockVerificationFindOne.mockResolvedValue(verification);

      const result = await service.rejectVerification(1, 'Expired document', 7, 'admin@test.com');
      expect(result.success).toBe(true);
      expect(result.reason).toBe('Expired document');
    });
  });

  // ─── getStatus ────────────────────────────────────────────────────────────

  describe('getStatus', () => {
    it('throws NotFoundException when user not found', async () => {
      mockUserFindByPk.mockResolvedValue(null);
      mockVerificationFindOne.mockResolvedValue(null);

      await expect(service.getStatus(999)).rejects.toThrow(NotFoundException);
    });

    it('returns correct permissions for level 0 user', async () => {
      mockUserFindByPk.mockResolvedValue(buildUser({ verificationLevel: 0 }));
      mockVerificationFindOne.mockResolvedValue(null);

      const status = await service.getStatus(1);

      expect(status.permissions.canBrowse).toBe(true);
      expect(status.permissions.canContact).toBe(false);
      expect(status.permissions.canRequestViewing).toBe(false);
      expect(status.permissions.canPostListing).toBe(false);
    });

    it('returns canContact=true for level 2 user', async () => {
      mockUserFindByPk.mockResolvedValue(buildUser({ verificationLevel: 2 }));
      mockVerificationFindOne.mockResolvedValue(null);

      const status = await service.getStatus(1);

      expect(status.permissions.canContact).toBe(true);
      expect(status.permissions.canRequestViewing).toBe(true);
      expect(status.permissions.canPostListing).toBe(false);
    });

    it('returns canPostListing=true for level 3 user', async () => {
      mockUserFindByPk.mockResolvedValue(buildUser({ verificationLevel: 3 }));
      mockVerificationFindOne.mockResolvedValue(null);

      const status = await service.getStatus(1);

      expect(status.permissions.canPostListing).toBe(true);
      expect(status.permissions.canBoostListing).toBe(true);
    });

    it('infers APPROVED status for user with level >= 2 and no verification record', async () => {
      mockUserFindByPk.mockResolvedValue(buildUser({ verificationLevel: 2 }));
      mockVerificationFindOne.mockResolvedValue(null);

      const status = await service.getStatus(1);

      expect(status.status).toBe('APPROVED');
    });

    it('includes nextSteps for unverified user', async () => {
      mockUserFindByPk.mockResolvedValue(
        buildUser({ verificationLevel: 0, emailVerified: false, phoneVerified: false }),
      );
      mockVerificationFindOne.mockResolvedValue(null);

      const status = await service.getStatus(1);

      expect(status.nextSteps.length).toBeGreaterThan(0);
    });

    it('returns canResubmit=true when verification is REJECTED', async () => {
      mockUserFindByPk.mockResolvedValue(buildUser({ verificationLevel: 1 }));
      mockVerificationFindOne.mockResolvedValue(
        buildVerification({ status: 'REJECTED', documents: [] }),
      );

      const status = await service.getStatus(1);
      expect(status.canResubmit).toBe(true);
    });
  });

  // ─── startIdVerification ─────────────────────────────────────────────────

  describe('startIdVerification', () => {
    it('throws NotFoundException when user not found', async () => {
      mockUserFindByPk.mockResolvedValue(null);

      await expect(
        service.startIdVerification(999, 'CI', {}),
      ).rejects.toThrow(NotFoundException);
    });

    it('returns current status if user already has level 2+', async () => {
      mockUserFindByPk.mockResolvedValue(buildUser({ verificationLevel: 2 }));
      mockVerificationFindOne.mockResolvedValue(null);

      const result = await service.startIdVerification(1, 'CI', {});

      // Should return getStatus() result without creating new verification
      expect(mockVerificationCreate).not.toHaveBeenCalled();
      expect(result.currentLevel).toBe(2);
    });

    it('throws BadRequestException KYC_PENDING when existing PENDING verification exists', async () => {
      mockUserFindByPk.mockResolvedValue(buildUser({ verificationLevel: 1 }));
      mockVerificationFindOne.mockResolvedValue(buildVerification({ status: 'PENDING' }));

      await expect(
        service.startIdVerification(1, 'CI', {}),
      ).rejects.toThrow(BadRequestException);

      try {
        await service.startIdVerification(1, 'CI', {});
      } catch (e: any) {
        expect(e.response?.code).toBe('KYC_PENDING');
      }
    });

    it('throws BadRequestException KYC_PENDING when existing IN_REVIEW verification exists', async () => {
      mockUserFindByPk.mockResolvedValue(buildUser({ verificationLevel: 1 }));
      mockVerificationFindOne.mockResolvedValue(buildVerification({ status: 'IN_REVIEW' }));

      await expect(
        service.startIdVerification(1, 'CI', {}),
      ).rejects.toThrow(BadRequestException);
    });

    it('creates new verification when no existing record', async () => {
      mockUserFindByPk.mockResolvedValue(buildUser({ verificationLevel: 1 }));
      mockVerificationFindOne
        .mockResolvedValueOnce(null) // first call: no existing
        .mockResolvedValueOnce(null); // getStatus call

      const createdVerification = buildVerification({
        status: 'PENDING',
        targetLevel: 2,
        documents: [],
      });
      mockVerificationCreate.mockResolvedValue(createdVerification);

      await service.startIdVerification(1, 'CI', {});

      expect(mockVerificationCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 1,
          status: 'PENDING',
          targetLevel: 2,
        }),
      );
    });
  });

  // ─── verifyProperty ───────────────────────────────────────────────────────

  describe('verifyProperty', () => {
    it('throws NotFoundException when user not found', async () => {
      mockUserFindByPk.mockResolvedValue(null);

      await expect(
        service.verifyProperty(999, 1, 'DEED', undefined),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException KYC_REQUIRED when user level < 2', async () => {
      mockUserFindByPk.mockResolvedValue(buildUser({ verificationLevel: 1 }));

      await expect(
        service.verifyProperty(1, 1, 'DEED', undefined),
      ).rejects.toThrow(BadRequestException);

      try {
        await service.verifyProperty(1, 1, 'DEED', undefined);
      } catch (e: any) {
        expect(e.response?.code).toBe('KYC_REQUIRED');
      }
    });

    it('throws BadRequestException when no file provided', async () => {
      mockUserFindByPk.mockResolvedValue(buildUser({ verificationLevel: 2 }));
      mockVerificationFindOne.mockResolvedValue(null);

      await expect(
        service.verifyProperty(1, 1, 'DEED', undefined),
      ).rejects.toThrow(BadRequestException);
    });

    it('returns current status if user already at level 3', async () => {
      mockUserFindByPk.mockResolvedValue(buildUser({ verificationLevel: 3 }));
      mockVerificationFindOne.mockResolvedValue(null);

      const result = await service.verifyProperty(1, 1, 'DEED', undefined);

      expect(mockVerificationCreate).not.toHaveBeenCalled();
      expect(result.currentLevel).toBe(3);
    });
  });
});
