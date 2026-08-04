import { useNavigate } from "@tanstack/react-router";
import { useAuthStore } from "@/stores/auth.store";

export function useSocialLogin() {
  const navigate = useNavigate();
  const isLoading = useAuthStore((state) => state.isLoading);
  const signInWithGoogle = useAuthStore((state) => state.signInWithGoogle);
  const signInWithApple = useAuthStore((state) => state.signInWithApple);

  const continueWithGoogle = async () => {
    await signInWithGoogle();
    await navigate({ to: "/home" });
  };

  const continueWithApple = async () => {
    await signInWithApple();
    await navigate({ to: "/home" });
  };

  return {
    isLoading,
    continueWithGoogle,
    continueWithApple,
  };
}
