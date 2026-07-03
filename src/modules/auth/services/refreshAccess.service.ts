
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { ENV } from '../../../config/envConfig';
import { RefreshRepository } from '../repository/refreshTokens.repository';
import type { JwtPayload, TokenPair } from '../interfaces/auth.interface';

export class RefreshAccessService {
  private repo = new RefreshRepository();

  // Used by googleCallback after OAuth success
  issueTokens = async (
    userId: string, 
    email: string, 
    username: string
  ): Promise<TokenPair> => {
    const payload: JwtPayload = { id: userId, email, username };

    const accessToken = jwt.sign(payload, ENV.JWT_ACCESS_SECRET, {
      expiresIn: '15m',
    });
    const refreshToken = jwt.sign(payload, ENV.JWT_REFRESH_SECRET, {
      expiresIn: '7d',
    });


    const hashed = await bcrypt.hash(refreshToken, 10);
    const expires_at=new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.repo.storeRefreshToken(userId, hashed, expires_at);

    return { accessToken, refreshToken };
  };

  rotateAccessToken = async (rawRefreshToken: string): Promise<string> => {
    const payload = jwt.verify(
      rawRefreshToken,
      ENV.JWT_REFRESH_SECRET
    ) as JwtPayload;

    const rows = await this.repo.getValidRefreshTokens(payload.id);

    let matched = false;
    for (const row of rows) {
      if (await bcrypt.compare(rawRefreshToken, row.hashed_token)) {
        matched = true;
        break;
      }
    }

    if (!matched) throw new Error('INVALID_REFRESH_TOKEN');

    // Re-sign with same payload shape
    return jwt.sign(
      { id: payload.id, email: payload.email, username: payload.username },
      ENV.JWT_ACCESS_SECRET,
      { expiresIn: '15m' }
    );
  };

  revokeTokens = async (rawRefreshToken: string): Promise<void> => {
    try {
      const payload = jwt.verify(
        rawRefreshToken,
        ENV.JWT_REFRESH_SECRET
      ) as JwtPayload;
      await this.repo.deleteAllRefreshTokens(payload.id);
    } catch {
      // Already expired — fine
    }
  };
}