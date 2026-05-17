interface BlogAuthorCardProps {
  name: string;
  role: string;
  locale: string;
}

export default function BlogAuthorCard({ name, role }: BlogAuthorCardProps) {
  return (
    <div className="flex items-center gap-4 rounded-[16px] border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-6">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-bg-card)] text-[16px] font-semibold text-[var(--color-text-primary)]">
        {name.charAt(0)}
      </div>
      <div>
        <p className="text-[15px] font-semibold text-[var(--color-text-primary)]">
          {name}
        </p>
        <p className="text-[13px] text-[var(--color-text-muted)]">{role}</p>
      </div>
    </div>
  );
}
