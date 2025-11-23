import { extractHeaderToken, genHex, getJti } from '../core/helper';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import Redis from 'ioredis';
import { jwtVerify, SignJWT } from 'jose';
import { User } from '../db/entities/user.entity.js';
import { type AuthModuleOptions } from './auth.module.js';

@Injectable()
export class AuthService {
  constructor(
    @Inject('AUTH_OPTIONS') private readonly options: AuthModuleOptions,
    @Inject('REDIS_CLIENT') private readonly redisClient: Redis,
  ) {}

  //generate access token
  async genToken(
    user_id: string | number,
    data: any,
    type = this.options.type || 'user',
  ) {
    const token_id = genHex();
    return this.signJwt(data, { type, token_id, sub_id: user_id });
  }

  async verifyJwt(req: any) {
    try {
      const token = extractHeaderToken(req);

      if (!token) throw new UnauthorizedException('No token provided');

      return await jwtVerify(token, Buffer.from(this.options.secret));
    } catch (error) {
      console.error('JWT verification error:', error);
      throw new UnauthorizedException('Invalid token');
    }
  }

  //sign jwt
  private signJwt(
    data: any,
    opts: {
      type: string;
      token_id: string;
      sub_id: string | number;
      audience?: string;
    },
  ) {
    const signJwt = new SignJWT(data)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setIssuer(opts.type)
      .setSubject(opts.sub_id.toString());

    if (opts.token_id) signJwt.setJti(getJti(opts.token_id));

    if (opts.audience || this.options.audience)
      signJwt.setAudience(opts.audience || this.options.audience);

    if (this.options.expiresIn)
      signJwt.setExpirationTime(`${this.options.expiresIn}s`);

    return signJwt.sign(Buffer.from(this.options.secret));
  }

  async getUser(payloadJwt: any) {
    try {
      const userId = payloadJwt.payload.sub;

      let subscriptionStatus;

      try {
        const redisData = await this.redisClient.get(
          `subscriptionStatus:${userId}`,
        );
        subscriptionStatus = redisData ? JSON.parse(redisData) : null;
      } catch (redisError) {
        console.warn('Redis error, using database values:', redisError);
      }

      return { ...payloadJwt.payload, subscriptionStatus };
    } catch (error) {
      console.error('Error in getUser:', error);
      throw new UnauthorizedException('Invalid user');
    }
  }
}
