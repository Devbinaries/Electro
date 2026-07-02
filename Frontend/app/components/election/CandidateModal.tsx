import { useState } from "react";

interface PositionOption {
  id: number;
  name: string;
}

interface Props {
  positions: PositionOption[];
  onClose: () => void;
  onSave: (payload: { positionId: number; name: string; photo: File | null }) => Promise<void>;
}

export default function CandidateModal({ positions, onClose, onSave }: Props) {
  const [name, setName] = useState("");
  const [positionId, setPositionId] = useState(String(positions[0]?.id ?? ""));
  const [photo, setPhoto] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim() || !positionId) {
      setError("Name and position are required.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await onSave({
        positionId: Number(positionId),
        name: name.trim(),
        photo,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save candidate.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6">
        <h2 className="mb-6 text-2xl font-bold">Add Candidate</h2>

        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        <div className="space-y-4">
          <select
            value={positionId}
            onChange={(event) => setPositionId(event.target.value)}
            className="w-full rounded-xl border p-3"
          >
            {positions.map((position) => (
              <option key={position.id} value={position.id}>
                {position.name}
              </option>
            ))}
          </select>

          <input
            placeholder="Full Name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full rounded-xl border p-3"
          />

          <input
            type="file"
            accept="image/*"
            onChange={(event) => setPhoto(event.target.files?.[0] ?? null)}
          />
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="rounded-xl border px-4 py-2">
            Cancel
          </button>
          <button
            onClick={() => void handleSave()}
            disabled={loading}
            className="rounded-xl bg-blue-600 px-4 py-2 text-white disabled:opacity-60"
          >
            {loading ? "Saving…" : "Save Candidate"}
          </button>
        </div>
      </div>
    </div>
  );
}
