import { useState } from "react";
import { LogIn, UserPlus } from "lucide-react";
import type * as api from "@/lib/api";
import { BackButton, PrimaryButton, SecondaryButton } from "./ui";

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
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const isRegister = mode === "register";

  return (
    <section className="surface-enter mx-auto grid min-h-[calc(100vh-4.25rem)] max-w-6xl items-center px-4 py-10 sm:px-6">
      <div>
        <BackButton className="mb-4" label="Back" onClick={onBack} />
        <div className="grid overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl shadow-slate-200/70 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="bg-slate-950 p-8 text-white sm:p-10">
            <p className="text-sm font-black uppercase text-emerald-300">Student Access</p>
            <h1 className="mt-3 text-3xl font-black leading-tight sm:text-5xl">
              Sign in before your test is recorded.
            </h1>
            <p className="mt-5 max-w-md text-sm leading-6 text-slate-300">
              Your attempts, scores, answers, and feedback will be saved securely once you continue with a student
              account.
            </p>
            <div className="mt-8 grid gap-3 text-sm font-bold text-slate-200">
              <span>Saved quiz attempts</span>
              <span>Backend marking</span>
              <span>Admin-visible progress</span>
            </div>
          </div>

          <form
            className="grid gap-4 p-6 sm:p-10"
            onSubmit={async (event) => {
              event.preventDefault();
              setError("");

              if (!email.trim() || !password.trim() || (isRegister && !fullName.trim())) {
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
                    fullName: fullName.trim(),
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
            <div className="inline-grid grid-cols-2 rounded-lg border border-slate-200 bg-slate-50 p-1">
              <button
                className={`inline-flex h-10 items-center justify-center gap-2 rounded-md text-sm font-black transition ${
                  !isRegister ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500"
                }`}
                type="button"
                onClick={() => {
                  setMode("login");
                  setError("");
                }}
              >
                <LogIn aria-hidden="true" size={16} />
                Login
              </button>
              <button
                className={`inline-flex h-10 items-center justify-center gap-2 rounded-md text-sm font-black transition ${
                  isRegister ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500"
                }`}
                type="button"
                onClick={() => {
                  setMode("register");
                  setError("");
                }}
              >
                <UserPlus aria-hidden="true" size={16} />
                Register
              </button>
            </div>

            {isRegister && (
              <StudentField label="Full name" value={fullName} onChange={setFullName} />
            )}
            <StudentField label="Email" type="email" value={email} onChange={setEmail} />
            <StudentField label="Password" type="password" value={password} onChange={setPassword} />

            {(error || authError) && (
              <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700">
                {error || authError}
              </p>
            )}

            <PrimaryButton disabled={busy} type="submit">
              {busy ? "Please wait..." : isRegister ? "Create Student Account" : "Sign In"}
            </PrimaryButton>
            <button
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
              disabled={busy}
              type="button"
              onClick={onGoogleLogin}
            >
              Continue with Google
            </button>
            <SecondaryButton disabled={busy} type="button" onClick={onBack}>
              Continue Later
            </SecondaryButton>
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
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2 text-sm font-bold text-slate-700">
      {label}
      <input
        className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-slate-950 outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10"
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
