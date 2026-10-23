import Link from "next/link";

export default function Home() {
  return (
    <main>
      <h1>WOD Tracker</h1>
      <Link href="/movements">Movements</Link>
    </main>
  );
}
