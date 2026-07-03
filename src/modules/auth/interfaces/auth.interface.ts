// All tokens use this same payload shape
export interface JwtPayload {
  id: string;
  email: string;
  username: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUser {
  id: string;
  username: string;
  email_id: string;
  first_name: string;
  last_name: string | null;
  sso_provider: string | null;
  sso_provider_id: string | null;
  account_status: 'Pending Approval' | 'Active' | 'Deleted';
}

export interface RefreshTokenRow {
  id: string;
  user_id: string;
  hashed_token: string;
  expires_at: Date;
}