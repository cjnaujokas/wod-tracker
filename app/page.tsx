import Link from "next/link";
import { SignOutButton } from "./sign-out-button";

export default function Home() {
  return (
    <main>
      <h1>WOD Tracker</h1>
      <Link href="/movements">Movements</Link>
      <Link href="/workouts/new">New workout</Link>
      <SignOutButton />
    </main>
  );
}
