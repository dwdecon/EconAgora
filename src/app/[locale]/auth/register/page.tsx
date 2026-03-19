import { Link } from "@/i18n/navigation";
import RegisterForm from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        <h1 className="text-3xl font-bold">注册</h1>
        <RegisterForm />
        <p className="text-gray-text text-sm">
          已有账号？{" "}
          <Link href="/auth/login" className="text-primary hover:underline">
            登录
          </Link>
        </p>
      </div>
    </main>
  );
}
