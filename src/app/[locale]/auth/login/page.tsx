import { Link } from "@/i18n/navigation";
import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        <h1 className="text-3xl font-bold">Sign in</h1>
        <LoginForm />
        <p className="text-sm text-gray-text">
          Need an account?{" "}
          <Link href="/auth/register" className="text-primary hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </main>
  );
}
