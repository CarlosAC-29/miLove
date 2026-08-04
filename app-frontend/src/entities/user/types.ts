/** Proveedores de identidad soportados por MiLove. */
export type AuthProvider = "google" | "apple" | "email";

/** DTO tal como lo devolverá el backend REST. */
export interface UserDto {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  provider: AuthProvider;
  createdAt: string;
}

/** Modelo de dominio consumido por la UI. */
export interface User {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly avatar?: string;
  readonly provider: AuthProvider;
  readonly createdAt: string;
}

/**
 * Sesión de la aplicación. Hoy el token es simulado; cuando exista backend
 * será un JWT + refresh token sin cambios en la UI.
 */
export interface AuthSession {
  readonly user: User;
  readonly accessToken: string;
  readonly refreshToken?: string;
  readonly expiresAt?: string;
}

export interface SignInWithEmailInput {
  readonly email: string;
  readonly password: string;
}

export interface SignUpWithEmailInput {
  readonly name: string;
  readonly email: string;
  readonly password: string;
}

export function mapUser(dto: UserDto): User {
  return { ...dto };
}
