import { Link } from "@/i18n/navigation";
import PageShell from "@/components/layout/PageShell";
import RegisterForm from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <PageShell width="3xl" className="pb-16">
      <div className="flex min-h-[55vh] flex-col items-center justify-center gap-6">
        <h1 className="text-3xl font-bold">Create account</h1>
        <RegisterForm />
        <p className="text-sm text-[var(--color-text-secondary)]">
          Already registered?{" "}
          <Link href="/auth/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </PageShell>
  );
}
