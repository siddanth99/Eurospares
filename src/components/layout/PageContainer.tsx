export default function PageContainer({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1 px-8 py-8">
      <div className="max-w-7xl mx-auto space-y-6">{children}</div>
    </div>
  );
}
