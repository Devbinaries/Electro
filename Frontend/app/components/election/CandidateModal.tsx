import { useState } from "react";

interface Props {
  onClose: () => void;
}

export default function CandidateModal({
  onClose,
}: Props) {
  const [photo, setPhoto] =
    useState<File | null>(null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6">
        <h2 className="mb-6 text-2xl font-bold">
          Add Candidate
        </h2>

        <div className="space-y-4">
          <input
            placeholder="Full Name"
            className="w-full rounded-xl border p-3"
          />

          <input
            placeholder="Student ID"
            className="w-full rounded-xl border p-3"
          />

          <input
            placeholder="Department"
            className="w-full rounded-xl border p-3"
          />

          <textarea
            placeholder="Manifesto"
            rows={5}
            className="w-full rounded-xl border p-3"
          />

          <input
            type="file"
            accept="image/*"
            onChange={(e) =>
              setPhoto(
                e.target.files?.[0] ??
                  null
              )
            }
          />
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-xl border px-4 py-2"
          >
            Cancel
          </button>

          <button
            className="rounded-xl bg-blue-600 px-4 py-2 text-white"
          >
            Save Candidate
          </button>
        </div>
      </div>
    </div>
  );
}