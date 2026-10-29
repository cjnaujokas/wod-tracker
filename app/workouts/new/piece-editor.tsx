"use client";

import {
  CLOCK_FIELD_LABELS,
  PIECE_CLOCK_FIELDS,
  PIECE_TYPES,
  PIECE_TYPE_LABELS,
} from "@/lib/piece-types";
import { LOAD_UNITS, type LoadUnit } from "@/lib/units";
import {
  emptyMovement,
  moveItem,
  withClock,
  type DraftMovement,
  type DraftPiece,
  type MovementGroup,
} from "@/lib/piece-draft";

type Props = {
  piece: DraftPiece;
  index: number;
  count: number;
  movementGroups: MovementGroup[];
  onChange: (piece: DraftPiece) => void;
  onMove: (delta: -1 | 1) => void;
  onRemove: () => void;
};

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function PieceEditor({
  piece,
  index,
  count,
  movementGroups,
  onChange,
  onMove,
  onRemove,
}: Props) {
  const n = index + 1;
  const set = (patch: Partial<DraftPiece>) => onChange({ ...piece, ...patch });
  const setMovements = (movements: DraftMovement[]) => set({ movements });
  const setMovement = (key: string, patch: Partial<DraftMovement>) =>
    setMovements(
      piece.movements.map((m) => (m.key === key ? { ...m, ...patch } : m)),
    );
  const clockFields = piece.type === "" ? [] : PIECE_CLOCK_FIELDS[piece.type];

  return (
    <li>
      <p>
        <select
          aria-label={`Piece ${n} type`}
          value={piece.type}
          onChange={(e) => set({ type: e.target.value as DraftPiece["type"] })}
        >
          <option value="">Choose type…</option>
          {PIECE_TYPES.map((t) => (
            <option key={t} value={t}>
              {PIECE_TYPE_LABELS[t]}
            </option>
          ))}
        </select>{" "}
        <input
          aria-label={`Piece ${n} title`}
          placeholder="Title (optional)"
          value={piece.title}
          onChange={(e) => set({ title: e.target.value })}
        />{" "}
        <input
          aria-label={`Piece ${n} scheme`}
          placeholder="Scheme, e.g. 21-15-9"
          value={piece.scheme}
          onChange={(e) => set({ scheme: e.target.value })}
        />{" "}
        <button type="button" onClick={() => onMove(-1)} disabled={index === 0}>
          ↑
        </button>
        <button
          type="button"
          onClick={() => onMove(1)}
          disabled={index === count - 1}
        >
          ↓
        </button>
        <button type="button" onClick={onRemove} disabled={count === 1}>
          Remove piece
        </button>
      </p>

      {clockFields.length > 0 && (
        <p>
          {clockFields.map((f) => (
            <label key={f}>
              {capitalize(CLOCK_FIELD_LABELS[f])}{" "}
              <input
                placeholder="m:ss"
                size={7}
                value={piece[f]}
                onChange={(e) => onChange(withClock(piece, f, e.target.value))}
              />{" "}
            </label>
          ))}
        </p>
      )}

      <ol>
        {piece.movements.map((m, j) => {
          const where = `Piece ${n} movement ${j + 1}`;
          return (
            <li key={m.key}>
              <select
                aria-label={where}
                value={m.movementId}
                onChange={(e) =>
                  setMovement(m.key, { movementId: e.target.value })
                }
              >
                <option value="">Choose movement…</option>
                {movementGroups.map(([category, options]) => (
                  <optgroup key={category} label={category}>
                    {options.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>{" "}
              <input
                aria-label={`${where} reps`}
                placeholder="Reps"
                inputMode="numeric"
                size={4}
                value={m.reps}
                onChange={(e) => setMovement(m.key, { reps: e.target.value })}
              />{" "}
              <input
                aria-label={`${where} load`}
                placeholder="Load"
                inputMode="decimal"
                size={5}
                value={m.load}
                onChange={(e) => setMovement(m.key, { load: e.target.value })}
              />
              <select
                aria-label={`${where} load unit`}
                value={m.unit}
                onChange={(e) =>
                  setMovement(m.key, { unit: e.target.value as LoadUnit })
                }
              >
                {LOAD_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>{" "}
              <input
                aria-label={`${where} distance in meters`}
                placeholder="Distance (m)"
                inputMode="decimal"
                size={7}
                value={m.distance}
                onChange={(e) =>
                  setMovement(m.key, { distance: e.target.value })
                }
              />{" "}
              <button
                type="button"
                onClick={() => setMovements(moveItem(piece.movements, j, -1))}
                disabled={j === 0}
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => setMovements(moveItem(piece.movements, j, 1))}
                disabled={j === piece.movements.length - 1}
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() =>
                  setMovements(piece.movements.filter((x) => x.key !== m.key))
                }
              >
                Remove
              </button>
            </li>
          );
        })}
      </ol>
      <button
        type="button"
        onClick={() => setMovements([...piece.movements, emptyMovement()])}
      >
        Add movement
      </button>
    </li>
  );
}
