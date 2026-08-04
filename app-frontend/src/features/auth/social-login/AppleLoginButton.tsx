import { Apple } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useSocialLogin } from "./useSocialLogin";

export function AppleLoginButton() {
  const { isLoading, continueWithApple } = useSocialLogin();
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setError(null);
    try {
      await continueWithApple();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "No se pudo iniciar con Apple.");
    }
  };

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        className="h-11 w-full justify-center rounded-xl bg-surface text-sm"
        onClick={handleClick}
        disabled={isLoading}
      >
        <Apple className="size-4" />
        Continuar con Apple
      </Button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
