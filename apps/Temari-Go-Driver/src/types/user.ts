export type UserRole = 'driver' | 'admin' | string;

export type UserMe = {
  id: string;
  name?: string | null;
  email?: string | null;
  username?: string | null;
  phone_number?: string | null;
  role?: UserRole | null;
  language_preference?: string | null;
  [key: string]: unknown;
};
