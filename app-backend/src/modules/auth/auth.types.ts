export type AuthProvider = "google" | "apple" | "email";

export interface UserDto {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  provider: AuthProvider;
  createdAt: string;
}

export interface AuthSessionDto {
  user: UserDto;
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}
