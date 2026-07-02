import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";

import {
  createCandidateRecord,
  createElection,
  createPosition,
  importVoters,
} from "~/services/election";
import { getApiErrorMessage } from "~/utils/apiError";
import { useAuthStore } from "~/store/authStore";

const electionSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  startDate: z.string(),
  endDate: z.string(),
  positionsInput: z.string().min(1),
});

type ElectionFormData = z.infer<typeof electionSchema> & {
  eligibleFile?: FileList;
};

function parsePositions(input: string) {
  const rawEntries = input
    .split(/\r?\n|\./)
    .map((s) => s.trim())
    .filter(Boolean);

  return rawEntries.map((entry) => {
    const [left, ...rest] = entry.split("|");
    const title = (left ?? "").trim();
    const candidatesRaw = rest.join("|").trim();

    const candidates = candidatesRaw
      ? candidatesRaw.split(",").map((c) => {
          const match = c.trim().match(/^(.*?)\s*\[(.*?)\]$/);
          const name = match ? match[1].trim() : c.trim();
          return { name };
        })
      : [];

    return { position: title, candidates };
  });
}

export default function CreateElectionPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ElectionFormData>({
    resolver: zodResolver(electionSchema),
    defaultValues: {
      positionsInput: "",
    },
  });

  const onSubmit = async (data: ElectionFormData) => {
    setLoading(true);
    setError("");

    try {
      const positions = parsePositions(data.positionsInput || "");
      const created = await createElection({
        title: data.title,
        description: data.description,
        start_date: new Date(data.startDate).toISOString(),
        end_date: new Date(data.endDate).toISOString(),
        ...(user?.role === "officer" ? { electoral_officer: Number(user.id) } : {}),
      });

      for (const position of positions) {
        const createdPosition = await createPosition({
          election: created.id,
          name: position.position,
        });

        for (const candidate of position.candidates) {
          await createCandidateRecord({
            election: created.id,
            position: createdPosition.id,
            name: candidate.name,
          });
        }
      }

      const files = data.eligibleFile;
      if (files && files.length > 0) {
        await importVoters(created.election_id, files[0]);
      }

      navigate(`/officer/election/${created.election_id}`);
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to create election."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-2 text-3xl font-bold">Create Election</h1>
      <p className="mb-8 text-slate-500">Configure a new election using the backend API.</p>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 rounded-2xl bg-white p-6 shadow">
        <div>
          <label className="mb-2 block font-medium">Election Title</label>
          <input {...register("title")} className="w-full rounded-xl border p-3" />
          {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title.message}</p>}
        </div>

        <div>
          <label className="mb-2 block font-medium">Description</label>
          <textarea
            {...register("description")}
            rows={4}
            className="w-full rounded-xl border p-3 h-50 resize-none [scrollbar-width:none]"
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-500">{errors.description.message}</p>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block font-medium">Start Date</label>
            <input type="datetime-local" {...register("startDate")} className="w-full rounded-xl border p-3" />
          </div>
          <div>
            <label className="mb-2 block font-medium">End Date</label>
            <input type="datetime-local" {...register("endDate")} className="w-full rounded-xl border p-3" />
          </div>
        </div>

        <div>
          <label className="mb-2 block font-medium">Positions</label>
          <p className="mb-2 text-sm text-slate-500">
            One per line: Position Title | Name [Department], Other [Dept]
          </p>
          <textarea
            {...register("positionsInput")}
            rows={6}
            className="w-full rounded-xl border p-3 h-50 resize-none [scrollbar-width:none]"
          />
          {errors.positionsInput && (
            <p className="mt-1 text-sm text-red-500">{errors.positionsInput.message}</p>
          )}
        </div>

        <div>
          <label className="mb-2 block font-medium">Voter list (CSV)</label>
          <input
            type="file"
            {...register("eligibleFile")}
            accept=".csv,.xlsx,.xls"
            className="w-full rounded-xl border p-3"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? "Creating…" : "Create Election"}
        </button>
      </form>
    </div>
  );
}
