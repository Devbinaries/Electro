interface CandidateSelection {
  position: string;
  candidate: string;
}

interface ConfirmationModalProps {
  isOpen: boolean;
  selections: CandidateSelection[];
  onClose: () => void;
  onConfirm: () => void;
}

export default function ConfirmationModal({
  isOpen,
  selections,
  onClose,
  onConfirm,
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="border-b p-6">
          <h2 className="text-2xl font-bold text-slate-900">
            Confirm Your Vote
          </h2>

          <p className="mt-2 text-sm text-slate-600">
            Please review your selections carefully. Once submitted,
            your vote cannot be changed.
          </p>
        </div>

        {/* Selected Candidates */}
        <div className="max-h-[60vh] overflow-y-auto p-6">
          <div className="space-y-4">
            {selections.map((item) => (
              <div
                key={item.position}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4"
              >
                <p className="text-sm font-medium text-slate-500">
                  {item.position}
                </p>

                <h3 className="mt-1 text-lg font-semibold text-slate-900">
                  {item.candidate}
                </h3>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse gap-3 border-t p-6 sm:flex-row sm:justify-end">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-300 px-6 py-3 font-medium text-slate-700 hover:bg-slate-100"
          >
            Go Back
          </button>

          <button
            onClick={onConfirm}
            className="rounded-xl bg-green-600 px-6 py-3 font-semibold text-white transition hover:bg-green-700"
          >
            Cast My Vote
          </button>
        </div>
      </div>
    </div>
  );
}