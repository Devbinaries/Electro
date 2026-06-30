import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createElection } from "~/services/election";

const electionSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  startDate: z.string(),
  endDate: z.string(),
  status: z.enum(["draft", "scheduled", "active"]),
  // positionsInput: a textual representation (see UI) parsed into positions array
  positionsInput: z.string().min(1),
  eligibleVoters: z.number().min(0).optional(),
});

type ElectionFormData = z.infer<typeof electionSchema> & {
  eligibleFile?: FileList;
};

function parsePositions(input: string) {
  // split by newline or period
  const rawEntries = input
    .split(/\r?\n|\./)
    .map((s) => s.trim())
    .filter(Boolean);

  const positions = rawEntries.map((entry) => {
    const [left, ...rest] = entry.split("|");
    const title = (left ?? "").trim();
    const candidatesRaw = rest.join("|").trim();

    const candidates = candidatesRaw
      ? candidatesRaw.split(",").map((c) => {
          const match = c.trim().match(/^(.*?)\s*\[(.*?)\]$/);
          const name = match ? match[1].trim() : c.trim();
          const department = match ? match[2].trim() : undefined;
          const id = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
          return { id, name, department };
        })
      : [];

    return { position: title, candidates };
  });

  return positions;
}

async function parseCsvFile(file: File) {
  const text = await new Promise<string>((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result ?? ""));
    fr.onerror = (e) => reject(e);
    fr.readAsText(file);
  });

  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  // crude count: assume first line may be header — if header contains non-numeric values, keep it
  return lines.length;
}

export default function CreateElectionPage() {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<ElectionFormData>({
    resolver: zodResolver(electionSchema),
    defaultValues: {
      positionsInput: "",
      eligibleVoters: 0,
      status: "draft",
    },
  });

  const onSubmit = async (data: ElectionFormData) => {
    try {
      // parse positions
      const positions = parsePositions(data.positionsInput || "");

      // determine eligible voters: prefer CSV upload if provided
      let eligible = data.eligibleVoters ?? 0;
      const files = (data as any).eligibleFile as FileList | undefined;
      if (files && files.length > 0) {
        const file = files[0];
        if (file.name.endsWith(".csv")) {
          eligible = await parseCsvFile(file);
        } else if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
          alert("XLSX parsing is not supported in this demo. Please upload CSV or enter eligible voters manually.");
          return;
        }
      }

      console.log("Parsed positions:", positions);

      const election = await createElection({
        name: data.title,
        description: data.description,
        status: data.status,
        startDate: data.startDate,
        endDate: data.endDate,
        positions: positions,
        eligibleVoters: eligible,
      } as any);

      navigate(`/officer/elections/${election.id}`);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-2 text-3xl font-bold">Create Election</h1>

      <p className="mb-8 text-slate-500">Configure a new election.</p>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6 rounded-2xl bg-white p-6 shadow"
      >
        <div>
          <label className="mb-2 block font-medium">Election Title</label>

          <input
            {...register("title")}
            className="w-full rounded-xl border p-3"
          />

          {errors.title && (
            <p className="mt-1 text-sm text-red-500">{errors.title.message}</p>
          )}
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

            <input
              type="datetime-local"
              {...register("startDate")}
              className="w-full rounded-xl border p-3"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">End Date</label>

            <input
              type="datetime-local"
              {...register("endDate")}
              className="w-full rounded-xl border p-3"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block font-medium">Positions</label>
          <p className="text-sm text-slate-500 mb-2">
            Enter positions one per line or separated by a period. Use the format:
            <span className="block font-mono">Position Title | Name [Department], Other [Dept]</span>
          </p>

          <textarea
            {...register("positionsInput")}
            rows={6}
            className="w-full rounded-xl border p-3 h-50 resize-none [scrollbar-width:none]"
            placeholder={"Vice-President | James [Computer Science], Lydia [Fashion Design].\nSecretary | Amina [Law]"}
          />

          {errors.positionsInput && (
            <p className="mt-1 text-sm text-red-500">{errors.positionsInput.message}</p>
          )}
        </div>

        <div>
          <label className="mb-2 block font-medium">Eligible Voters (number or CSV upload)</label>
          <p className="text-sm text-slate-500 mb-2">Upload a CSV to auto-count rows, or enter a number.</p>

          <div className="grid gap-4 md:grid-cols-2">
            <input
              type="number"
              {...register("eligibleVoters", { valueAsNumber: true })}
              className="w-full rounded-xl border p-3"
              min={0}
            />

            <input
              type="file"
              {...register("eligibleFile")}
              accept=".csv,.xlsx,.xls"
              className="w-full rounded-xl border p-3"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block font-medium">Status</label>

          <select {...register("status")} className="w-full rounded-xl border p-3">
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
            <option value="active">Active</option>
          </select>
        </div>

        <button
          type="submit"
          className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
        >
          Create Election
        </button>
      </form>
    </div>
  );
}