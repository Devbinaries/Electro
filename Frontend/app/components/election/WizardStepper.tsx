interface Props {
  currentStep: number;
}

export default function WizardStepper({
  currentStep,
}: Props) {
  const steps = [
    "Details",
    "Positions",
    "Candidates",
    "Review",
    "Publish",
  ];

  return (
    <div className="mb-8 flex flex-wrap gap-4">
      {steps.map((step, index) => (
        <div
          key={step}
          className={`
            rounded-full
            px-4
            py-2
            text-sm
            ${
              currentStep >=
              index + 1
                ? "bg-blue-600 text-white"
                : "bg-slate-200"
            }
          `}
        >
          {index + 1}. {step}
        </div>
      ))}
    </div>
  );
}