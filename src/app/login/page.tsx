"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Zap, Loader2 } from "lucide-react";
import { signInSchema, type SignInInput } from "@/lib/validations";
import { Starfield } from "@/components/starfield";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
  });

  const onSubmit = async (data: SignInInput) => {
    setAuthError("");
    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    if (result?.error) {
      setAuthError("Invalid email or password. Check your credentials.");
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4" style={{ background: "var(--space-dark)" }}>
      <Starfield />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-3 group mb-6">
            <div className="relative w-12 h-12 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border border-[rgba(245,197,24,0.5)] animate-pulse" />
              <div className="absolute inset-1.5 rounded-full border border-[rgba(0,212,255,0.3)]" />
              <Zap className="w-5 h-5 text-yellow-400" />
            </div>
          </Link>
          <h1
            className="text-3xl font-black mb-2 gold-text"
            style={{ fontFamily: "'Orbitron', sans-serif", letterSpacing: "0.05em" }}
          >
            HOLOCRON
          </h1>
          <p
            className="text-sm tracking-widest uppercase"
            style={{ color: "var(--text-secondary)", fontFamily: "'Rajdhani', sans-serif" }}
          >
            Access Your Archive
          </p>
        </div>

        {/* Card */}
        <div className="holo-card p-8">
          <div className="section-divider" />

          <form id="login-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {authError && (
              <div
                className="px-4 py-3 rounded-lg text-sm text-center"
                style={{ background: "rgba(255,64,64,0.1)", border: "1px solid rgba(255,64,64,0.3)", color: "#ff6b6b" }}
                role="alert"
              >
                {authError}
              </div>
            )}

            {/* Email */}
            <div>
              <label
                htmlFor="login-email"
                className="block text-xs font-semibold mb-2 tracking-widest uppercase"
                style={{ color: "var(--text-secondary)", fontFamily: "'Orbitron', sans-serif" }}
              >
                Email
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                className="sci-fi-input"
                placeholder="your@email.com"
                {...register("email")}
              />
              {errors.email && (
                <p className="mt-1 text-xs" style={{ color: "#ff6b6b" }}>{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="login-password"
                className="block text-xs font-semibold mb-2 tracking-widest uppercase"
                style={{ color: "var(--text-secondary)", fontFamily: "'Orbitron', sans-serif" }}
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  className="sci-fi-input pr-11"
                  placeholder="••••••••"
                  {...register("password")}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
                  ) : (
                    <Eye className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs" style={{ color: "#ff6b6b" }}>{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              id="login-submit"
              disabled={isSubmitting}
              className="btn-primary w-full flex items-center justify-center gap-2"
              style={{ padding: "0.875rem", fontSize: "0.85rem" }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                "ACCESS ARCHIVE"
              )}
            </button>
          </form>

          <div className="section-divider" />

          <p className="text-center text-sm" style={{ color: "var(--text-secondary)" }}>
            No account?{" "}
            <Link
              href="/signup"
              className="font-semibold transition-colors hover:text-yellow-300"
              style={{ color: "var(--gold)" }}
            >
              Join the Order
            </Link>
          </p>
        </div>

        <p className="text-center mt-6 text-xs" style={{ color: "rgba(136,153,170,0.5)" }}>
          Your archive is encrypted and private
        </p>
      </div>
    </div>
  );
}
