import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useSocialLogin } from "./useSocialLogin";

export function GoogleLoginButton() {
  const { isLoading, continueWithGoogle } = useSocialLogin();
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setError(null);
    try {
      await continueWithGoogle();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "No se pudo iniciar con Google."
      );
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
        <span className="inline-flex size-5 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
          G
        </span>
        Continuar con Google
      </Button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
