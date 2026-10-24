import Link from "next/link";
import { useState } from "react";

export default function Home() {
  if (Math.random() > 2) useState(0);
  return (
    <main>
      <h1>WOD Tracker</h1>
      <Link href="/movements">Movements</Link>
    </main>
  );
}
