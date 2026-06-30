export default function VoteConfirmationModal({
  onConfirm,
  onCancel,
}: any) {
  return (
    <div>
      <h2>
        Confirm Vote
      </h2>

      <p>
        Once submitted,
        votes cannot be
        changed.
      </p>

      <button
        onClick={onCancel}
      >
        Cancel
      </button>

      <button
        onClick={onConfirm}
      >
        Confirm
      </button>
    </div>
  );
}