import { Injectable } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'node:crypto';

type TokenPayload = {
  id: number;
  role: string;
  exp: number;
};

@Injectable()
export class TokenService {
  private readonly secret = process.env.AUTH_SECRET || 'library-app-course-secret';

  sign(user: { id: number | string; role: string }) {
    const payload: TokenPayload = {
      id: Number(user.id),
      role: user.role,
      exp: Date.now() + 1000 * 60 * 60 * 8
    };

    const body = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
    return `${body}.${this.signature(body)}`;
  }

  verify(token = ''): TokenPayload | null {
    const [body, signature] = token.split('.');
    if (!body || !signature) return null;

    const expected = this.signature(body);
    const left = Buffer.from(signature);
    const right = Buffer.from(expected);
    if (left.length !== right.length || !timingSafeEqual(left, right)) return null;

    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as TokenPayload;
    if (!payload.id || payload.exp < Date.now()) return null;
    return payload;
  }

  private signature(body: string) {
    return createHmac('sha256', this.secret).update(body).digest('base64url');
  }
}
