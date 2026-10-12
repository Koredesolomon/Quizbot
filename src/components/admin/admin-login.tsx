import type { ReactNode } from "react";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { GoogleIcon } from "../ui";

export const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const googleOnlyAuthMessage = "This email is linked to Google sign-in.";

export function isGoogleOnlyAuthError(error: unknown) {
  return error instanceof Error && error.message.toLowerCase().includes("google sign-in");
}

export type AdminAccount = {
  name: string;
  email: string;
  role: string;
  accessCode: string;
  accessToken?: string;
  authProvider?: "password" | "google";
};

export function AdminLogin({
  adminEmail,
  authError = "",
  onUnlock,
  onGoogleLogin,
  onForgotPassword,
  onBack,
}: {
  adminEmail: string;
  authError?: string;
  onUnlock: (identifier: string, accessCode: string) => boolean | Promise<boolean>;
  onGoogleLogin: () => void;
  onForgotPassword: (email: string) => void;
  onBack: () => void;
}) {
  const [identifier, setIdentifier] = useState(adminEmail);
  const [accessCode, setAccessCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [googleOnlyEmail, setGoogleOnlyEmail] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <AuthScene>
      <AuthCard
        title="Welcome back"
        subtitle="Sign in to manage questions, attempts, and feedback"
        footer={
          <>
            <p>
              <button className="font-black text-emerald-300 hover:text-emerald-200" type="button" onClick={onBack}>
                Return to student site
              </button>
            </p>
            <p>Private admin channel</p>
          </>
        }
      >
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            setError("");
            setGoogleOnlyEmail("");

            const email = identifier.trim().toLowerCase();
            const password = accessCode.trim();

            if (!email || !password) {
              setError("Enter your admin email address and password.");
              return;
            }

            if (!emailPattern.test(email)) {
              setError("Enter a valid admin email address.");
              return;
            }

            setBusy(true);
            try {
              const unlocked = await Promise.resolve(onUnlock(email, password));

              if (!unlocked) {
                setError("Incorrect admin email or password.");
                return;
              }

              setAccessCode("");
              setError("");
            } catch (loginError) {
              if (isGoogleOnlyAuthError(loginError)) {
                setGoogleOnlyEmail(identifier.trim().toLowerCase());
                setError(googleOnlyAuthMessage);
              } else {
                setError(loginError instanceof Error ? loginError.message : "Admin sign in failed.");
              }
            } finally {
              setBusy(false);
            }
          }}
        >
          <div className="grid gap-4">
            <AuthField
              label="Email address"
              type="email"
              value={identifier}
              autoComplete="email"
              onChange={(value) => {
                setIdentifier(value);
                setError("");
                setGoogleOnlyEmail("");
              }}
            />
            <AuthField
              label="Password"
              type={showPassword ? "text" : "password"}
              value={accessCode}
              autoComplete="current-password"
              onChange={(value) => {
                setAccessCode(value);
                setError("");
                setGoogleOnlyEmail("");
              }}
              trailing={
                <button
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="grid h-9 w-9 place-items-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-950"
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                >
                  {showPassword ? <EyeOff aria-hidden="true" size={18} /> : <Eye aria-hidden="true" size={18} />}
                </button>
              }
            />
          </div>

          {googleOnlyEmail ? (
            <div className="mt-3 grid gap-3 rounded-md border border-sky-300/30 bg-sky-300/10 p-3 text-sm font-bold text-sky-100">
              <p>{googleOnlyAuthMessage}</p>
              <button
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-white px-3 text-sm font-black text-slate-950 transition hover:bg-sky-50"
                type="button"
                onClick={onGoogleLogin}
              >
                <GoogleIcon className="h-4 w-4 shrink-0" />
                Continue with Google
              </button>
            </div>
          ) : (
            (error || authError) && <p className="mt-3 text-sm font-bold text-rose-300">{error || authError}</p>
          )}

          <AuthSubmitButton disabled={busy}>{busy ? "Please wait..." : "Sign in"}</AuthSubmitButton>
          <button
            className="mt-3 inline-flex w-full items-center justify-center text-center text-sm font-black text-sky-200 transition hover:text-white"
            type="button"
            onClick={() => {
              const resetEmail = identifier.trim().toLowerCase();
              setGoogleOnlyEmail("");

              if (!emailPattern.test(resetEmail)) {
                setError("Enter your admin email address before resetting your password.");
                return;
              }

              setError("");
              onForgotPassword(resetEmail);
            }}
          >
            Forgot password?
          </button>
          <button
            className="mt-3 inline-flex w-full items-center justify-center gap-2 text-center text-sm font-black text-emerald-300 transition hover:text-emerald-200"
            type="button"
            onClick={onGoogleLogin}
          >
            <GoogleIcon className="h-5 w-5 shrink-0" />
            Sign in with Google
          </button>
        </form>
      </AuthCard>
    </AuthScene>
  );
}

export function AuthScene({ children }: { children: ReactNode }) {
  return (
    <section className="surface-enter relative -mt-px min-h-[calc(100vh-4.25rem)] overflow-hidden bg-black px-4 py-16 text-white sm:px-6">
      <div className="absolute inset-0 bg-[linear-gradient(145deg,rgba(0,0,0,0.98),rgba(6,71,155,0.55)_52%,rgba(8,124,34,0.42))]" />
      <div className="relative mx-auto flex min-h-[560px] max-w-6xl items-center justify-center">{children}</div>
    </section>
  );
}

export function AuthCard({
  title,
  subtitle,
  footer,
  children,
}: {
  title: string;
  subtitle: string;
  footer: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="modal-card-enter w-full max-w-md rounded-lg border border-white/15 bg-white/10 p-6 shadow-2xl shadow-black/30 backdrop-blur sm:p-8">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="brand-logo mx-auto mb-6 h-auto w-56" src="/Logo.png" alt="TLCHub" />
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-black text-white">{title}</h1>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-300">{subtitle}</p>
      </div>
      {children}
      <p className="mt-5 text-center text-xs font-semibold leading-5 text-slate-400">
        By signing in you agree to the <span className="underline">Terms of Service</span> and{" "}
        <span className="underline">Privacy Policy</span>.
      </p>
      <div className="mt-8 space-y-2 text-center text-sm font-semibold text-slate-300">{footer}</div>
    </div>
  );
}

export function AuthField({
  label,
  value,
  type = "text",
  autoComplete,
  onChange,
  trailing,
}: {
  label: string;
  value: string;
  type?: string;
  autoComplete?: string;
  onChange: (value: string) => void;
  trailing?: ReactNode;
}) {
  return (
    <label className="grid gap-2 text-sm font-bold text-slate-100">
      {label}
      <span className="flex h-11 items-center rounded-lg border border-sky-200 bg-white px-3 text-slate-950 transition focus-within:border-emerald-400 focus-within:ring-4 focus-within:ring-emerald-500/20">
        <input
          autoComplete={autoComplete}
          className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-slate-400"
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        {trailing}
      </span>
    </label>
  );
}

export function AuthSubmitButton({ children, disabled = false }: { children: ReactNode; disabled?: boolean }) {
  return (
    <button
      className="mt-4 inline-flex h-12 w-full items-center justify-center rounded-lg bg-emerald-600 px-4 text-sm font-black text-white shadow-xl shadow-blue-950/30 transition hover:-translate-y-0.5 hover:bg-emerald-500 hover:shadow-emerald-950/20 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
      disabled={disabled}
      type="submit"
    >
      {children}
    </button>
  );
}
