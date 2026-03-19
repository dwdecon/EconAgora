import { Link } from "@/i18n/navigation";
import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        <h1 className="text-3xl font-bold">登录</h1>
        <LoginForm />
        <p className="text-gray-text text-sm">
          没有账号？{" "}
          <Link href="/auth/register" className="text-primary hover:underline">
            注册
          </Link>
        </p>
      </div>
    </main>
  );
}
