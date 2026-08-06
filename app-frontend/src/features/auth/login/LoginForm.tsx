import { Link } from "@tanstack/react-router";
import { useState } from "react";
import type { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLogin } from "./useLogin";

interface LoginFormProps {
  mode: "login" | "register";
}

interface EmailLoginFormState {
  name: string;
  email: string;
  password: string;
  registrationCode: string;
}

export function LoginForm({ mode }: LoginFormProps) {
  const { isLoading, loginWithEmail, registerWithEmail } = useLogin();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<EmailLoginFormState>({
    name: "",
    email: "",
    password: "",
    registrationCode: ""
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    try {
      if (mode === "register") {
        await registerWithEmail({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          registrationCode: form.registrationCode
        });
        return;
      }

      await loginWithEmail({
        email: form.email.trim(),
        password: form.password
      });
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "No se pudo completar la autenticacion."
      );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {mode === "register" ? (
        <Input
          value={form.name}
          onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
          autoComplete="name"
          placeholder="Tu nombre"
          required
          minLength={2}
          className="h-11 rounded-xl bg-surface"
        />
      ) : null}

      {mode === "register" ? (
        <Input
          type="password"
          value={form.registrationCode}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, registrationCode: event.target.value }))
          }
          autoComplete="off"
          placeholder="Codigo de registro"
          required
          className="h-11 rounded-xl bg-surface"
        />
      ) : null}

      <Input
        type="email"
        value={form.email}
        onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
        autoComplete="email"
        placeholder="tu@email.com"
        required
        className="h-11 rounded-xl bg-surface"
      />

      <Input
        type="password"
        value={form.password}
        onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
        autoComplete={mode === "register" ? "new-password" : "current-password"}
        placeholder="Contrasena"
        required
        minLength={6}
        className="h-11 rounded-xl bg-surface"
      />

      <Button type="submit" className="h-11 w-full rounded-xl text-sm" disabled={isLoading}>
        {mode === "register" ? "Crear cuenta con email" : "Continuar con email"}
      </Button>

      {error ? <p className="text-xs text-destructive">{error}</p> : null}

      <p className="text-center text-xs text-muted-foreground">
        {mode === "register" ? "Ya tienes cuenta?" : "Todavia no tienes cuenta?"}{" "}
        <Link
          to={mode === "register" ? "/login" : "/register"}
          className="font-semibold text-foreground underline underline-offset-4"
        >
          {mode === "register" ? "Inicia sesion" : "Registrate"}
        </Link>
      </p>
    </form>
  );
}
