import { useState } from "react";
import type { ReactNode } from "react";
import { ArrowRight, Eye, EyeOff, MailCheck } from "lucide-react";
import { BackButton, PrimaryButton } from "./ui";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function PasswordReset({
  initialEmail = "",
  token = "",
  onRequestReset,
  onResetPassword,
  onBack,
}: {
  initialEmail?: string;
  token?: string;
  onRequestReset: (input: { email: string }) => Promise<{ message: string }>;
  onResetPassword: (input: { token: string; password: string }) => Promise<{ message: string }>;
  onBack: () => void;
}) {
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const hasToken = Boolean(token);

  return (
    <section className="surface-enter mx-auto grid min-h-[calc(100vh-4.25rem)] max-w-3xl items-center px-4 py-10 sm:px-10">
      <div>
        <BackButton className="mb-5" label="Back" onClick={onBack} />
        <form
          className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[0_24px_70px_rgba(8,43,99,0.14)] sm:p-9"
          onSubmit={async (event) => {
            event.preventDefault();
            setError("");
            setMessage("");

            if (!hasToken && !email.trim()) {
              setError("Enter your account email address.");
              return;
            }

            if (!hasToken && !emailPattern.test(email.trim())) {
              setError("Enter a valid email address for password reset.");
              return;
            }

            if (hasToken) {
              if (password.length < 6) {
                setError("Password must be at least 6 characters.");
                return;
              }

              if (password !== confirmPassword) {
                setError("Passwords do not match.");
                return;
              }
            }

            setBusy(true);
            try {
              const response = hasToken
                ? await onResetPassword({ token, password })
                : await onRequestReset({ email: email.trim().toLowerCase() });
              setMessage(response.message);
              setPassword("");
              setConfirmPassword("");
            } catch (submitError) {
              setError(submitError instanceof Error ? submitError.message : "Password reset failed.");
            } finally {
              setBusy(false);
            }
          }}
        >
          <div className="mb-7 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-md bg-[var(--brand-green)] text-white">
              <MailCheck aria-hidden="true" size={24} />
            </div>
            <h1 className="mt-4 text-2xl font-black tracking-normal text-[var(--ink)]">
              {hasToken ? "Create a new password" : "Reset your password"}
            </h1>
            <p className="mx-auto mt-2 max-w-md text-sm font-semibold leading-6 text-[var(--ink-muted)]">
              {hasToken
                ? "Choose a fresh password for your TLCHub account."
                : "Enter your email and we will send a secure reset link if the account exists."}
            </p>
          </div>

          <div className="grid gap-4">
            {!hasToken ? (
              <ResetField label="Email address" type="email" value={email} onChange={setEmail} />
            ) : (
              <>
                <ResetField
                  label="New password"
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
                <ResetField
                  label="Confirm password"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                />
              </>
            )}
          </div>

          {error && <p className="mt-4 rounded-md bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700">{error}</p>}
          {message && <p className="mt-4 rounded-md bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700">{message}</p>}

          <PrimaryButton className="mt-5 w-full" disabled={busy} type="submit">
            {busy ? "Please wait..." : hasToken ? "Update password" : "Send reset link"}
            {!busy && <ArrowRight aria-hidden="true" className="ml-2" size={17} />}
          </PrimaryButton>
        </form>
      </div>
    </section>
  );
}

function ResetField({
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
