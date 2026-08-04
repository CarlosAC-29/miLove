import { useNavigate } from "@tanstack/react-router";
import type { SignInWithEmailInput, SignUpWithEmailInput } from "@/entities/user/types";
import { useAuthStore } from "@/stores/auth.store";

export function useLogin() {
  const navigate = useNavigate();
  const isLoading = useAuthStore((state) => state.isLoading);
  const signInWithEmail = useAuthStore((state) => state.signInWithEmail);
  const signUpWithEmail = useAuthStore((state) => state.signUpWithEmail);

  const loginWithEmail = async (input: SignInWithEmailInput) => {
    await signInWithEmail(input);
    await navigate({ to: "/home" });
  };

  const registerWithEmail = async (input: SignUpWithEmailInput) => {
    await signUpWithEmail(input);
    await navigate({ to: "/home" });
  };

  return {
    isLoading,
    loginWithEmail,
    registerWithEmail,
  };
}
