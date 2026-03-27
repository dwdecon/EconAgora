import { Link } from "@/i18n/navigation";
import PageShell from "@/components/layout/PageShell";
import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <PageShell width="3xl" className="pb-16">
      <div className="flex min-h-[55vh] flex-col items-center justify-center gap-6">
        <h1 className="text-3xl font-bold">Sign in</h1>
        <LoginForm />
        <p className="text-sm text-[var(--color-text-secondary)]">
          Need an account?{" "}
          <Link href="/auth/register" className="text-primary hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </PageShell>
  );
}
