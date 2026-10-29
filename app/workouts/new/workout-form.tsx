"use client";

import {
  startTransition,
  useActionState,
  useState,
  type FormEvent,
} from "react";
import { createWorkoutSessionAction } from "./actions";
import { PieceEditor } from "./piece-editor";
import {
  emptyPiece,
  moveItem,
  serializePiece,
  type DraftPiece,
  type MovementGroup,
} from "@/lib/piece-draft";
import type { FormState } from "@/lib/workout-validation";

export function WorkoutForm({
  movementGroups,
}: {
  movementGroups: MovementGroup[];
}) {
  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    createWorkoutSessionAction,
    {},
  );
  const [date, setDate] = useState("");
  const [title, setTitle] = useState("");
  // Fixed key for the first piece: same on server render and client
  const [pieces, setPieces] = useState<DraftPiece[]>([emptyPiece("first")]);

  function updatePiece(next: DraftPiece) {
    setPieces((ps) => ps.map((p) => (p.key === next.key ? next : p)));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData();
    formData.set("date", date);
    formData.set("title", title);
    // Order in these arrays becomes position on the server
    formData.set("pieces", JSON.stringify(pieces.map(serializePiece)));
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
          <PieceEditor
            key={piece.key}
            piece={piece}
            index={index}
            count={pieces.length}
            movementGroups={movementGroups}
            onChange={updatePiece}
            onMove={(delta) => setPieces((ps) => moveItem(ps, index, delta))}
            onRemove={() =>
              setPieces((ps) => ps.filter((p) => p.key !== piece.key))
            }
          />
        ))}
      </ol>
      <button
        type="button"
        onClick={() => setPieces((ps) => [...ps, emptyPiece()])}
      >
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
