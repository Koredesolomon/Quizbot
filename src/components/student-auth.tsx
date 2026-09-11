import { useState } from "react";
import type { ReactNode } from "react";
import { ArrowRight, Check, Eye, EyeOff, LogIn, UserPlus } from "lucide-react";
import type * as api from "@/lib/api";
import { BackButton, GoogleIcon, PrimaryButton } from "./ui";

type Mode = "login" | "register";

export function StudentAuth({
  initialMode = "login",
  onLogin,
  onRegister,
  onGoogleLogin,
  authError = "",
  onBack,
}: {
  initialMode?: Mode;
  onLogin: (input: { email: string; password: string }) => Promise<api.AuthResponse>;
  onRegister: (input: { fullName: string; email: string; password: string }) => Promise<api.AuthResponse>;
  onGoogleLogin: () => void;
  authError?: string;
  onBack: () => void;
}) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const isRegister = mode === "register";
  const heading = isRegister ? "Create your practice account." : "Pick up your practice where you left off.";

  return (
    <section className="surface-enter mx-auto grid min-h-[calc(100vh-4.25rem)] max-w-6xl items-center px-4 py-10 sm:px-10 lg:py-14">
      <div>
        <BackButton className="mb-5" label="Back to home" onClick={onBack} />
        <div className="grid items-stretch overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-[0_24px_70px_rgba(8,43,99,0.14)] lg:grid-cols-[0.88fr_1.12fr]">
          <div className="relative flex min-h-full flex-col justify-center overflow-hidden bg-[var(--brand-blue-deep)] p-7 text-white sm:p-10">
            <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full border-[28px] border-white/10" />
            <div className="absolute -bottom-24 -left-16 h-64 w-64 rounded-full border-[32px] border-[var(--brand-green)]/25" />
            <div className="relative">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#8de19a]">Student practice room</p>
              <h1 className="mt-4 max-w-md text-2xl font-black leading-[1.08] tracking-[-0.03em] sm:text-4xl">
                {heading}
              </h1>
              <p className="mt-5 max-w-md text-sm leading-7 text-blue-100">
                Your attempts, scores, answers, and feedback stay together, so each session has somewhere useful to go.
              </p>
              <div className="mt-8 grid gap-4 text-sm font-bold text-blue-50">
                {[
                  "Save every quiz attempt",
                  "Get rubric-based marking",
                  "Return to your progress dashboard",
                ].map((item) => (
                  <span className="flex items-center gap-3" key={item}>
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-[var(--brand-green)] text-white"><Check size={14} /></span>
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <div className="relative mt-10 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.12em] text-blue-200">
              <span className="h-2 w-2 rounded-full bg-[var(--brand-green-bright)]" />
              <span>Account</span><ArrowRight size={13} /><span>Practice</span><ArrowRight size={13} /><span>Progress</span>
            </div>
          </div>

          <form
            className="mx-auto grid w-full max-w-xl content-center gap-4 p-6 sm:p-10"
            onSubmit={async (event) => {
              event.preventDefault();
              setError("");

              if (!email.trim() || !password.trim() || (isRegister && (!firstName.trim() || !lastName.trim()))) {
                setError("Complete all required fields.");
                return;
              }

              if (password.length < 6) {
                setError("Password must be at least 6 characters.");
                return;
              }

              setBusy(true);
              try {
                if (isRegister) {
                  await onRegister({
                    fullName: `${firstName.trim()} ${lastName.trim()}`,
                    email: email.trim().toLowerCase(),
                    password,
                  });
                } else {
                  await onLogin({
                    email: email.trim().toLowerCase(),
                    password,
                  });
                }
              } catch (submitError) {
                setError(submitError instanceof Error ? submitError.message : "Student authentication failed.");
              } finally {
                setBusy(false);
              }
            }}
          >
            <div className="mb-2">
              <span className="text-xs font-black uppercase tracking-[0.16em] text-[var(--brand-green)]">{isRegister ? "New here?" : "Welcome back"}</span>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-[var(--ink)]">{isRegister ? "Create an account" : "Sign in to continue"}</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-[var(--ink-muted)]">
                {isRegister
                  ? "Keep your quiz progress, feedback, and revision support in one place."
                  : "Continue with your saved attempts, scores, and AI feedback."}
              </p>
            </div>
            <div className="grid gap-3">
              <button
                className="inline-flex min-h-11 items-center justify-center gap-3 rounded-md border border-[var(--line)] bg-[var(--surface)] px-5 py-3 text-sm font-black text-[var(--ink)] transition hover:-translate-y-0.5 hover:border-[var(--brand-blue)] hover:text-[var(--brand-blue)] hover:shadow-md"
                disabled={busy}
                type="button"
                onClick={onGoogleLogin}
              >
                <GoogleIcon className="h-5 w-5 shrink-0" />
                Continue with Google
              </button>
            </div>
            <div className="flex items-center gap-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[var(--ink-muted)]">
              <span className="h-px flex-1 bg-[var(--line)]" /> or <span className="h-px flex-1 bg-[var(--line)]" />
            </div>
            <div className="inline-grid grid-cols-2 rounded-md border border-[var(--line)] bg-[var(--brand-ice)] p-1">
              <button
                className={`inline-flex h-10 items-center justify-center gap-2 rounded-sm text-sm font-black transition ${
                  !isRegister ? "bg-[var(--brand-blue)] text-white shadow-sm" : "text-[var(--ink-muted)] hover:text-[var(--brand-blue)]"
                }`}
                type="button"
                onClick={() => { setMode("login"); setError(""); }}
              >
                <LogIn aria-hidden="true" size={16} />
                Login
              </button>
              <button
                className={`inline-flex h-10 items-center justify-center gap-2 rounded-sm text-sm font-black transition ${
                  isRegister ? "bg-[var(--brand-green)] text-white shadow-sm" : "text-[var(--ink-muted)] hover:text-[var(--brand-green)]"
                }`}
                type="button"
                onClick={() => { setMode("register"); setError(""); }}
              >
                <UserPlus aria-hidden="true" size={16} />
                Register
              </button>
            </div>

            {isRegister && (
              <div className="grid gap-3 sm:grid-cols-2">
                <StudentField label="First name" type="text" value={firstName} onChange={setFirstName} />
                <StudentField label="Last name" type="text" value={lastName} onChange={setLastName} />
              </div>
            )}
            <StudentField label="Email address" type="email" value={email} onChange={setEmail} />
            <StudentField
              label="Password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={setPassword}
              trailing={
                <button
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="grid h-9 w-9 place-items-center rounded-md text-[var(--ink-muted)] transition hover:bg-[var(--brand-ice)] hover:text-[var(--brand-blue)]"
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                >
                  {showPassword ? <EyeOff aria-hidden="true" size={17} /> : <Eye aria-hidden="true" size={17} />}
                </button>
              }
            />

            {(error || authError) && <p className="rounded-md bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700">{error || authError}</p>}

            <PrimaryButton className="mt-2 w-full" disabled={busy} type="submit">
              {busy ? "Please wait..." : isRegister ? "Create student account" : "Sign in"}
              {!busy && <ArrowRight aria-hidden="true" className="ml-2" size={17} />}
            </PrimaryButton>
            <button
              className="text-center text-sm font-bold text-[var(--ink-muted)] transition hover:text-[var(--brand-blue)]"
              type="button"
              onClick={() => {
                setMode(isRegister ? "login" : "register");
                setError("");
              }}
            >
              {isRegister ? "Already have an account? " : "Need an account? "}
              <span className="font-black text-[var(--brand-green)]">{isRegister ? "Sign in" : "Create one"}</span>
            </button>
            <p className="text-center text-xs font-semibold leading-5 text-[var(--ink-muted)]">
              By continuing, you agree to our <span className="font-black text-[var(--ink)]">Terms</span> and{" "}
              <span className="font-black text-[var(--ink)]">Privacy Policy</span>.
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}

function StudentField({
  label,
  type = "text",
  value,
  onChange,
  trailing,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  trailing?: ReactNode;
}) {
  return (
    <label className="grid gap-2 text-sm font-black text-[var(--ink)]">
      {label}
      <span className="flex h-12 items-center rounded-md border border-[var(--line)] bg-[var(--surface-muted)] transition focus-within:border-[var(--brand-green)] focus-within:bg-[var(--surface)] focus-within:ring-4 focus-within:ring-green-500/10">
        <input
          className="h-full min-w-0 flex-1 rounded-md bg-transparent px-3 text-[var(--ink)] outline-none placeholder:text-[var(--ink-muted)]"
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        {trailing && <span className="pr-1">{trailing}</span>}
      </span>
    </label>
  );
}
