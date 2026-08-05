import { create } from "zustand";
import type {
  AuthSession,
  SignInWithEmailInput,
  SignUpWithEmailInput,
  User
} from "@/entities/user/types";
import { authService } from "@/services/auth/auth.service";

interface AuthState {
  user: User | null;
  session: AuthSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (session: AuthSession) => void;
  hydrateSession: () => void;
  signInWithEmail: (input: SignInWithEmailInput) => Promise<void>;
  signUpWithEmail: (input: SignUpWithEmailInput) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  logout: () => Promise<void>;
}

function applySession(session: AuthSession | null) {
  return {
    session,
    user: session?.user ?? null,
    isAuthenticated: session !== null
  };
}

export const useAuthStore = create<AuthState>()((set, get) => {
  const restoredSession = authService.restoreSession();

  return {
    ...applySession(restoredSession),
    isLoading: false,
    login: (session) => {
      set({ ...applySession(session) });
    },
    hydrateSession: () => {
      const session = authService.restoreSession();
      set({ ...applySession(session) });
    },
    signInWithEmail: async (input) => {
      set({ isLoading: true });
      try {
        const session = await authService.signInWithEmail(input);
        set({ ...applySession(session), isLoading: false });
      } catch (error) {
        set({ isLoading: false });
        throw error;
      }
    },
    signUpWithEmail: async (input) => {
      set({ isLoading: true });
      try {
        const session = await authService.signUpWithEmail(input);
        set({ ...applySession(session), isLoading: false });
      } catch (error) {
        set({ isLoading: false });
        throw error;
      }
    },
    signInWithGoogle: async () => {
      set({ isLoading: true });
      try {
        const session = await authService.signInWithGoogle();
        set({ ...applySession(session), isLoading: false });
      } catch (error) {
        set({ isLoading: false });
        throw error;
      }
    },
    signInWithApple: async () => {
      set({ isLoading: true });
      try {
        const session = await authService.signInWithApple();
        set({ ...applySession(session), isLoading: false });
      } catch (error) {
        set({ isLoading: false });
        throw error;
      }
    },
    logout: async () => {
      set({ isLoading: true });
      const refreshToken = get().session?.refreshToken;
      set({ ...applySession(null), isLoading: true });
      try {
        await authService.signOut(refreshToken);
      } catch (error) {
        console.error(error);
      } finally {
        set({ ...applySession(null), isLoading: false });
      }
    }
  };
});
