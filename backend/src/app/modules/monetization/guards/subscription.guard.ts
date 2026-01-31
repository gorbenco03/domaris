/**
 * 🔐 SUBSCRIPTION GUARD
 *
 * Guard pentru verificarea accesului bazat pe subscription.
 * Folosit pentru funcționalități premium.
 *
 * Usage:
 * @UseGuards(AuthGuard, SubscriptionGuard)
 * @RequireSubscription() // sau @RequireSubscription('premium')
 * async premiumFeature() { ... }
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SubscriptionService } from '../services/subscription.service.js';

export const SUBSCRIPTION_KEY = 'requiredSubscription';
export const FEATURE_KEY = 'requiredFeature';

/**
 * Decorator pentru a cere un subscription activ
 * @param minPlan - Planul minim necesar ('free', 'standard', 'premium', 'business')
 */
export const RequireSubscription = (minPlan?: string) =>
  SetMetadata(SUBSCRIPTION_KEY, minPlan || 'any');

/**
 * Decorator pentru a cere o anumită capabilitate
 * @param feature - Feature necesar ('hasAIFeatures', 'hasAdvancedAnalytics', etc.)
 */
export const RequireFeature = (feature: string) =>
  SetMetadata(FEATURE_KEY, feature);

const PLAN_HIERARCHY: Record<string, number> = {
  free: 0,
  standard: 1,
  premium: 2,
  business: 3,
};

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private subscriptionService: SubscriptionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get required subscription level from decorator
    const requiredSubscription = this.reflector.getAllAndOverride<string>(
      SUBSCRIPTION_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Get required feature from decorator
    const requiredFeature = this.reflector.getAllAndOverride<string>(
      FEATURE_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no requirements, allow access
    if (!requiredSubscription && !requiredFeature) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    // Get user's subscription
    const subscription = await this.subscriptionService.getUserSubscription(user.id);

    // Check subscription requirement
    if (requiredSubscription) {
      if (requiredSubscription === 'any') {
        // Any paid subscription required
        if (!subscription || !subscription.isActiveAndValid()) {
          throw new ForbiddenException({
            code: 'SUBSCRIPTION_REQUIRED',
            message: 'This feature requires a paid subscription. Please upgrade your plan.',
            currentPlan: 'free',
          });
        }
      } else {
        // Specific plan or higher required
        const requiredLevel = PLAN_HIERARCHY[requiredSubscription] || 0;
        const currentPlan = (subscription?.plan as any)?.code || 'free';
        const currentLevel = PLAN_HIERARCHY[currentPlan] || 0;

        if (currentLevel < requiredLevel) {
          throw new ForbiddenException({
            code: 'UPGRADE_REQUIRED',
            message: `This feature requires ${requiredSubscription} plan or higher. Please upgrade.`,
            currentPlan,
            requiredPlan: requiredSubscription,
          });
        }
      }
    }

    // Check feature requirement
    if (requiredFeature) {
      const capabilities = this.subscriptionService.getUserCapabilities(subscription);
      const hasFeature = (capabilities as any)[requiredFeature];

      if (!hasFeature) {
        throw new ForbiddenException({
          code: 'FEATURE_NOT_AVAILABLE',
          message: `This feature is not available on your current plan. Please upgrade.`,
          requiredFeature,
        });
      }
    }

    return true;
  }
}
