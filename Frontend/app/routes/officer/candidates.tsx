import { useState } from "react";

import CandidateModal from "~/components/election/CandidateModal";

export default function CandidatesPage() {
  const [open, setOpen] =
    useState(false);

  const candidates = [
    {
      id: "1",
      name: "John Doe",
      department: "Computer Science",
      position: "President",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">
          Candidates
        </h1>

        <button
          onClick={() =>
            setOpen(true)
          }
          className="rounded-xl bg-blue-600 px-5 py-3 text-white"
        >
          Add Candidate
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {candidates.map(
          (candidate) => (
            <div
              key={candidate.id}
              className="rounded-2xl bg-white p-6 shadow"
            >
              <div className="mb-4 h-24 w-24 rounded-full bg-slate-200" />

              <h2 className="text-xl font-semibold">
                {candidate.name}
              </h2>

              <p className="text-slate-500">
                {
                  candidate.department
                }
              </p>

              <p className="mt-2 font-medium">
                {
                  candidate.position
                }
              </p>
            </div>
          )
        )}
      </div>

      {open && (
        <CandidateModal
          onClose={() =>
            setOpen(false)
          }
        />
      )}
    </div>
  );
}