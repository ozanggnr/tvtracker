"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Zap, Loader2, CheckCircle2 } from "lucide-react";
import { signUpSchema, type SignUpInput } from "@/lib/validations";
import { Starfield } from "@/components/starfield";

export default function SignUpPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState("");
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
  });

  const password = watch("password", "");

  const strengthChecks = [
    { label: "8+ characters", passed: password.length >= 8 },
    { label: "Uppercase letter", passed: /[A-Z]/.test(password) },
    { label: "Lowercase letter", passed: /[a-z]/.test(password) },
    { label: "Number", passed: /\d/.test(password) },
  ];

  const onSubmit = async (data: SignUpInput) => {
    setAuthError("");
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (!res.ok) {
        setAuthError(json.error || "Registration failed");
        return;
      }

      setSuccess(true);
      // Auto sign-in
      const signInResult = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (!signInResult?.error) {
        setTimeout(() => router.push("/dashboard"), 1000);
      }
    } catch {
      setAuthError("Network error. Please try again.");
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-10" style={{ background: "var(--space-dark)" }}>
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
            JOIN THE ORDER
          </h1>
          <p
            className="text-sm tracking-widest uppercase"
            style={{ color: "var(--text-secondary)", fontFamily: "'Rajdhani', sans-serif" }}
          >
            Create Your Holocron Account
          </p>
        </div>

        {/* Card */}
        <div className="holo-card p-8">
          <div className="section-divider" />

          {success && (
            <div
              className="mb-5 px-4 py-3 rounded-lg text-sm flex items-center gap-2"
              style={{ background: "rgba(0,230,118,0.1)", border: "1px solid rgba(0,230,118,0.3)", color: "#00e676" }}
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              Account created! Redirecting to your dashboard...
            </div>
          )}

          <form id="signup-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {authError && (
              <div
                className="px-4 py-3 rounded-lg text-sm text-center"
                style={{ background: "rgba(255,64,64,0.1)", border: "1px solid rgba(255,64,64,0.3)", color: "#ff6b6b" }}
                role="alert"
              >
                {authError}
              </div>
            )}

            {/* Name */}
            <div>
              <label
                htmlFor="signup-name"
                className="block text-xs font-semibold mb-2 tracking-widest uppercase"
                style={{ color: "var(--text-secondary)", fontFamily: "'Orbitron', sans-serif" }}
              >
                Jedi Name
              </label>
              <input
                id="signup-name"
                type="text"
                autoComplete="name"
                className="sci-fi-input"
                placeholder="Your name"
                {...register("name")}
              />
              {errors.name && (
                <p className="mt-1 text-xs" style={{ color: "#ff6b6b" }}>{errors.name.message}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="signup-email"
                className="block text-xs font-semibold mb-2 tracking-widest uppercase"
                style={{ color: "var(--text-secondary)", fontFamily: "'Orbitron', sans-serif" }}
              >
                Email
              </label>
              <input
                id="signup-email"
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
                htmlFor="signup-password"
                className="block text-xs font-semibold mb-2 tracking-widest uppercase"
                style={{ color: "var(--text-secondary)", fontFamily: "'Orbitron', sans-serif" }}
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="signup-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  className="sci-fi-input pr-11"
                  placeholder="Create a strong password"
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

              {/* Password strength */}
              {password.length > 0 && (
                <div className="mt-3 grid grid-cols-2 gap-1.5">
                  {strengthChecks.map((check) => (
                    <div key={check.label} className="flex items-center gap-1.5">
                      <div
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ background: check.passed ? "var(--success)" : "rgba(255,255,255,0.15)" }}
                      />
                      <span
                        className="text-[0.65rem]"
                        style={{ color: check.passed ? "#00e676" : "var(--text-secondary)" }}
                      >
                        {check.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              id="signup-submit"
              disabled={isSubmitting || success}
              className="btn-primary w-full flex items-center justify-center gap-2"
              style={{ padding: "0.875rem", fontSize: "0.85rem" }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                "CREATE ACCOUNT"
              )}
            </button>
          </form>

          <div className="section-divider" />

          <p className="text-center text-sm" style={{ color: "var(--text-secondary)" }}>
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold transition-colors hover:text-yellow-300"
              style={{ color: "var(--gold)" }}
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
