"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

export default function SignUpPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setPending(true);
    const { error } = await authClient.signIn.email({
      email: String(f.get("email")),
      password: String(f.get("password")),
    });
    setPending(false);
    if (error) return setError(error.message ?? "Sign up failed");
    router.push("/");
    router.refresh();
  }

  return (
    <main>
      <h1>Sign In</h1>
      <form onSubmit={onSubmit}>
        <input name="email" type="email" placeholder="Email" required />
        <input
          name="password"
          type="password"
          placeholder="Password"
          minLength={8}
          required
        />
        <button disabled={pending}>Sign in</button>
      </form>
      {error && <p>{error}</p>}
      <Link href="/sign-up">No account?</Link>
    </main>
  );
}
