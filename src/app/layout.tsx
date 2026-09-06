import type { Metadata } from "next";
import { Inter, Sora } from "next/font/google";
import "katex/dist/katex.min.css";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "STEM-JUPEB Test Platform",
  description: "AI-marked practice tests for STEM-JUPEB learners.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${sora.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => { try { const theme = localStorage.getItem("stem-jupeb-theme"); document.documentElement.classList.add(theme === "dark" ? "theme-dark" : "theme-light"); } catch (_) { document.documentElement.classList.add("theme-light"); } })();`,
          }}
        />
        {children}
      </body>
    </html>
  );
}
