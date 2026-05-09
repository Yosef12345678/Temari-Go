export type LoginRequest = {
  emailOrUsername: string;
  password: string;
};

export type DriverRegisterRequest = {
  name: string;
  email: string;
  phone_number?: string | null;
  username?: string | null;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn?: string;
  refreshTokenExpiresIn?: string;
};

export type LoginData = {
  user: unknown;
  tokens: AuthTokens;
};

export type RefreshRequest = {
  refreshToken: string;
};

export type RefreshData = {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: string;
};

export type DriverRegisterData = {
  id: string;
  name: string;
  email: string;
  status: 'pending_verification';
  message: string;
};
