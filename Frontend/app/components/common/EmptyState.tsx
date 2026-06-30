interface Props {
  title: string;
  description: string;
}

export default function EmptyState({
  title,
  description,
}: Props) {
  return (
    <div className="rounded-2xl bg-white p-10 text-center shadow">
      <h2 className="text-xl font-semibold">
        {title}
      </h2>

      <p className="mt-2 text-slate-500">
        {description}
      </p>
    </div>
  );
}