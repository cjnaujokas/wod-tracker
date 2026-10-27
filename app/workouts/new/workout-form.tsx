"use client";

import {
  startTransition,
  useActionState,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { createWorkoutSessionAction } from "./actions";
import { PIECE_TYPES, PIECE_TYPE_LABELS } from "@/lib/piece-types";
import type { FormState } from "@/lib/workout-validation";

type DraftPiece = { key: number; type: string; title: string; scheme: string };
type PieceField = "type" | "title" | "scheme";

const emptyPiece = (key: number): DraftPiece => ({
  key,
  type: "",
  title: "",
  scheme: "",
});

export function WorkoutForm() {
  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    createWorkoutSessionAction,
    {},
  );
  const [date, setDate] = useState("");
  const [title, setTitle] = useState("");
  const [pieces, setPieces] = useState<DraftPiece[]>([emptyPiece(0)]);
  const nextKey = useRef(1);

  function updatePiece(key: number, field: PieceField, value: string) {
    setPieces((ps) =>
      ps.map((p) => (p.key === key ? { ...p, [field]: value } : p)),
    );
  }

  function addPiece() {
    const key = nextKey.current++;
    setPieces((ps) => [...ps, emptyPiece(key)]);
  }

  function removePiece(key: number) {
    setPieces((ps) => ps.filter((p) => p.key !== key));
  }

  function movePiece(index: number, delta: -1 | 1) {
    setPieces((ps) => {
      const target = index + delta;
      if (target < 0 || target >= ps.length) return ps;
      const next = [...ps];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData();
    formData.set("date", date);
    formData.set("title", title);
    // Order in this array becomes position on the server
    formData.set(
      "pieces",
      JSON.stringify(
        pieces.map(({ type, title, scheme }) => ({ type, title, scheme })),
      ),
    );
    startTransition(() => formAction(formData));
  }

  return (
    <form onSubmit={handleSubmit}>
      <p>
        <label>
          Date{" "}
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
        {state.errors?.date && <span role="alert"> {state.errors.date}</span>}
      </p>

      <p>
        <label>
          Title (optional){" "}
          <input value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>
        {state.errors?.title && <span role="alert"> {state.errors.title}</span>}
      </p>

      <h2>Pieces</h2>
      <ol>
        {pieces.map((piece, index) => (
          <li key={piece.key}>
            <select
              aria-label={`Piece ${index + 1} type`}
              value={piece.type}
              onChange={(e) => updatePiece(piece.key, "type", e.target.value)}
            >
              <option value="">Choose type…</option>
              {PIECE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {PIECE_TYPE_LABELS[t]}
                </option>
              ))}
            </select>{" "}
            <input
              aria-label={`Piece ${index + 1} title`}
              placeholder="Title (optional)"
              value={piece.title}
              onChange={(e) => updatePiece(piece.key, "title", e.target.value)}
            />{" "}
            <input
              aria-label={`Piece ${index + 1} scheme`}
              placeholder="Scheme, e.g. 21-15-9"
              value={piece.scheme}
              onChange={(e) => updatePiece(piece.key, "scheme", e.target.value)}
            />{" "}
            <button
              type="button"
              onClick={() => movePiece(index, -1)}
              disabled={index === 0}
            >
              ↑
            </button>
            <button
              type="button"
              onClick={() => movePiece(index, 1)}
              disabled={index === pieces.length - 1}
            >
              ↓
            </button>
            <button
              type="button"
              onClick={() => removePiece(piece.key)}
              disabled={pieces.length === 1}
            >
              Remove
            </button>
          </li>
        ))}
      </ol>
      <button type="button" onClick={addPiece}>
        Add piece
      </button>
      {state.errors?.pieces && <p role="alert">{state.errors.pieces}</p>}

      <p>
        <button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : "Save workout"}
        </button>
      </p>
    </form>
  );
}
