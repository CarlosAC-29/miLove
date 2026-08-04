import { useNavigate } from "@tanstack/react-router";
import { useAuthStore } from "@/stores/auth.store";

export function useLogout() {
  const navigate = useNavigate();
  const isLoading = useAuthStore((state) => state.isLoading);
  const logout = useAuthStore((state) => state.logout);

  const performLogout = async () => {
    try {
      await logout();
    } finally {
      await navigate({ to: "/login", replace: true });
    }
  };

  return { isLoading, performLogout };
}
