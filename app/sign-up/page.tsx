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
    const { error } = await authClient.signUp.email({
      name: String(f.get("name")),
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
      <h1>Sign up</h1>
      <form onSubmit={onSubmit}>
        <input name="name" placeholder="Name" required />
        <input name="email" type="email" placeholder="Email" required />
        <input
          name="password"
          type="password"
          placeholder="Password"
          minLength={8}
          required
        />
        <button disabled={pending}>Sign up</button>
      </form>
      {error && <p>{error}</p>}
      <Link href="/sign-in">Already have an account?</Link>
    </main>
  );
}
