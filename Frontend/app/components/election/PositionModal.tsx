import { useState } from "react";

interface Props {
  onClose: () => void;
  onSave: (name: string) => Promise<void>;
}

export default function PositionModal({ onClose, onSave }: Props) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Position name is required.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await onSave(trimmedName);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save position.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6">
        <h2 className="mb-6 text-2xl font-bold">Add Position</h2>

        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        <input
          placeholder="Position name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="w-full rounded-xl border border-slate-300 p-3"
        />

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="rounded-xl border px-4 py-2">
            Cancel
          </button>
          <button
            onClick={() => void handleSave()}
            disabled={loading}
            className="rounded-xl bg-blue-600 px-4 py-2 text-white disabled:opacity-60"
          >
            {loading ? "Saving…" : "Save Position"}
          </button>
        </div>
      </div>
    </div>
  );
}
