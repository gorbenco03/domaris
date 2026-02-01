import { Module, Global } from '@nestjs/common';
import { ConsentService } from './consent.service.js';

/**
 * 🔒 CONSENT MODULE - GDPR Consent Tracking
 *
 * Purpose: Provides consent tracking functionality globally
 * Compliance: GDPR Article 7, Article 13-14
 *
 * Features:
 * - Global module (available everywhere)
 * - Consent recording during registration
 * - Consent withdrawal (GDPR right)
 * - Consent history for audit
 */

@Global()
@Module({
  providers: [ConsentService],
  exports: [ConsentService],
})
export class ConsentModule {}
