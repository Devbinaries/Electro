import { useNavigate } from "react-router";

export default function ConfirmationPage() {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <section className="mx-auto max-w-2xl rounded-3xl bg-white p-8 shadow-xl">
        <h1 className="text-3xl font-bold text-slate-900">Confirm Your Vote</h1>
        <p className="mt-3 text-slate-600">
          You are about to submit your vote for the selected candidate. Please review your choice carefully.
        </p>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-sm font-medium text-slate-500">Position</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-900">SRC President</h2>
          <p className="mt-2 text-slate-600">Selected candidate: John Doe</p>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-xl border border-slate-300 px-6 py-3 font-medium text-slate-700 hover:bg-slate-100"
          >
            Go Back
          </button>
          <button
            type="button"
            onClick={() => navigate("/voter/thank-you")}
            className="rounded-xl bg-green-600 px-6 py-3 font-semibold text-white transition hover:bg-green-700"
          >
            Submit Vote
          </button>
        </div>
      </section>
    </main>
  );
}
