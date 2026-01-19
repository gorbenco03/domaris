import { Injectable } from '@nestjs/common';

@Injectable()
export class KycService {
    async startIdVerification(userId: number, docType: string, files: any) {
        // 1. Upload files to S3 (mocked for now)
        console.log(`User ${userId} started KYC with ${docType}`);

        // 2. Create KYC record in DB
        // e.g., await KycRecord.create({ ... })

        // 3. Return pending status
        return {
            verificationId: `kyc_${Date.now()}`,
            status: 'pending',
            message: 'Documents received. Verification in progress.',
        };
    }

    async getStatus(userId: number) {
        // Fetch from DB
        // Mock response:
        return {
            level: 0,
            status: 'unverified', // or 'pending', 'verified'
            reasons: [],
        };
    }

    async verifyProperty(userId: number, propertyId: number, docType: string, file: any) {
        console.log(`User ${userId} uploading doc for property ${propertyId}`);
        return {
            docId: `doc_${Date.now()}`,
            status: 'pending',
            message: 'Property document uploaded.',
        };
    }
}
