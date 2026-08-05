import type { UserDto } from "../types";

/** Usuario base para el modo mock (sin backend). */
export const MOCK_USER: UserDto = {
  id: "usr-carlos",
  name: "Carlos Rivera",
  email: "carlos@milove.app",
  provider: "email",
  createdAt: "2026-01-12T10:00:00.000Z"
};

/** Pareja vinculada, usada por el espacio Finanzas Hogar. */
export const MOCK_PARTNER: UserDto = {
  id: "usr-laura",
  name: "Laura Gómez",
  email: "laura@milove.app",
  provider: "google",
  createdAt: "2026-01-12T10:05:00.000Z"
};
