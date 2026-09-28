import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | TLCHub",
  description: "How TLCHub collects, uses, protects, and shares user data for learning, quiz attempts, AI feedback, and account services.",
};

const lastUpdated = "September 28, 2026";

const sections = [
  {
    title: "1. Information we collect",
    body: [
      "Account information: name, email address, username when provided, password authentication details, Google sign-in profile details, and role information such as student or admin.",
      "Learning information: registered courses, selected modules, quiz attempts, answers, scores, marks, completion status, timestamps, AI feedback, and progress dashboard activity.",
      "Content and uploads: questions, explanations, rubrics, course materials, profile images, answer attachments, imported spreadsheets, and feedback submitted through the platform.",
      "Technical information: browser requests, device and connection details, error logs, security events, and basic usage information needed to keep the service reliable.",
      "Communication information: email address, password reset requests, welcome email delivery status, and messages sent through feedback or support channels.",
    ],
  },
  {
    title: "2. How we use your information",
    body: [
      "To create and secure student and admin accounts.",
      "To save quiz attempts, mark answers, calculate scores, and show learning progress.",
      "To provide AI-assisted marking, explanations, study guidance, and revision support.",
      "To let admins manage courses, modules, topics, quizzes, questions, reports, and feedback.",
      "To send account messages such as welcome emails, password reset links, and important service notices.",
      "To improve reliability, prevent misuse, investigate errors, and maintain the security of the platform.",
    ],
  },
  {
    title: "3. AI-assisted learning and marking",
    body: [
      "TLCHub may send theory answers, question prompts, model answers, rubrics, keywords, and related learning context to an AI provider to generate marking feedback or study support.",
      "The in-app assistant may receive safe app context such as the current screen, quiz progress, selected topics, recent results, and admin content counts so it can provide relevant help.",
      "We do not intentionally send stored passwords or access tokens to the AI assistant.",
      "AI feedback supports learning and review, but admins may still review content quality, reports, and platform activity.",
    ],
  },
  {
    title: "4. Google sign-in",
    body: [
      "If you choose Google sign-in, TLCHub receives the Google account details needed to authenticate you, such as your email address, name, profile image, and Google account identifier.",
      "Student Google sign-in is used to create or access a student account. Admin Google sign-in is limited to approved admin email addresses or domains.",
      "You can manage Google account permissions from your Google account settings.",
    ],
  },
  {
    title: "5. How we share information",
    body: [
      "We share information with service providers only when needed to run the platform, such as database hosting, email delivery, Google authentication, analytics, and AI processing.",
      "Admins can see information needed to manage learning activity, including quiz attempts, scores, submitted feedback, course registrations, and content records.",
      "We may disclose information if required by law, to protect the platform, or to respond to valid legal or security requests.",
      "We do not sell student personal information.",
    ],
  },
  {
    title: "6. Data retention",
    body: [
      "We keep account, course, quiz, attempt, answer, report, and feedback records for as long as needed to provide the learning service, maintain academic records, resolve issues, and meet operational requirements.",
      "Password reset tokens are temporary and expire after a short period. Uploads and profile images may remain until replaced, deleted, or removed by an admin process.",
      "When an account or record is deleted, some backup, security, audit, or legal records may remain for a limited period.",
    ],
  },
  {
    title: "7. Security",
    body: [
      "We use access controls, authentication, role checks, hashed passwords, protected API routes, and operational safeguards to reduce unauthorized access.",
      "No online service can guarantee perfect security. Users should keep passwords private, use trusted devices, and sign out on shared computers.",
      "If you believe your account or data has been accessed without permission, contact us as soon as possible.",
    ],
  },
  {
    title: "8. Your choices and rights",
    body: [
      "You can update account details available in your profile, change your sign-in method where supported, and request password reset emails.",
      "You may request access, correction, deletion, or review of personal information associated with your account, subject to identity verification and applicable retention requirements.",
      "You can choose not to provide optional information, but some features may not work without the information required to provide them.",
    ],
  },
  {
    title: "9. Children's privacy",
    body: [
      "TLCHub is designed for students and education support. If a student is below the age required for independent consent in their location, a parent, guardian, school, or authorized adult should approve use of the platform.",
      "If you believe a child provided personal information without appropriate permission, contact us so we can review the account.",
    ],
  },
  {
    title: "10. Changes to this policy",
    body: [
      "We may update this policy when our services, providers, laws, or data practices change.",
      "When we make meaningful changes, we will update the date on this page and may provide additional notice where appropriate.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[var(--background)] px-5 py-10 text-[var(--ink)] sm:px-8 lg:px-12">
      <article className="mx-auto max-w-4xl">
        <Link
          className="inline-flex text-sm font-medium text-[var(--brand-blue)] transition hover:text-[var(--brand-green)]"
          href="/"
        >
          Back to TLCHub
        </Link>

        <header className="mt-10 border-b border-[var(--line)] pb-8">
          <p className="w-fit rounded-[15px] border border-[var(--brand-green)] px-4 py-2 text-xs font-normal uppercase tracking-[0.18em] text-[var(--brand-green)]">
            Privacy Policy
          </p>
          <h1 className="mt-6 text-4xl font-black leading-tight tracking-normal text-[var(--ink)] sm:text-5xl">
            How TLCHub uses and protects user data
          </h1>
          <p className="mt-5 max-w-3xl text-base font-medium leading-8 text-[var(--ink-muted)]">
            This policy explains what information TLCHub collects, why we use it, how it supports learning and platform administration, and the choices users have.
          </p>
          <p className="mt-4 text-sm font-bold text-[var(--ink-muted)]">Last updated: {lastUpdated}</p>
        </header>

        <div className="grid gap-8 py-8">
          <section className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6">
            <h2 className="text-xl font-black text-[var(--ink)]">Who this policy covers</h2>
            <p className="mt-3 text-sm font-medium leading-7 text-[var(--ink-muted)]">
              This policy applies to students, admins, teachers, support users, and visitors who use TLCHub websites, apps, quiz tools, dashboards, AI assistant features, and related services.
            </p>
          </section>

          {sections.map((section) => (
            <section className="border-b border-[var(--line)] pb-8" key={section.title}>
              <h2 className="text-xl font-black text-[var(--ink)]">{section.title}</h2>
              <ul className="mt-4 grid gap-3 text-sm font-medium leading-7 text-[var(--ink-muted)]">
                {section.body.map((item) => (
                  <li className="flex gap-3" key={item}>
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--brand-green)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}

          <section className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6">
            <h2 className="text-xl font-black text-[var(--ink)]">Contact us</h2>
            <p className="mt-3 text-sm font-medium leading-7 text-[var(--ink-muted)]">
              For privacy questions, account requests, or data concerns, contact TLCHub at{" "}
              <a className="font-black text-[var(--brand-blue)] hover:text-[var(--brand-green)]" href="mailto:support@mytlchub.com">
                support@mytlchub.com
              </a>
              .
            </p>
          </section>
        </div>
      </article>
    </main>
  );
}
