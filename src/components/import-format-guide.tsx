"use client";

import { useState } from "react";
import { FileSpreadsheet, FileText } from "lucide-react";
import { MathContent } from "./math-content";
import { buildExcelTemplate, buildWordTemplate, downloadFile, loadTemplateImages, templateImages, templateLines, templateTips, type TemplateImage } from "@/lib/question-template";

const lineStyle = {
  topic: "mt-1 font-black text-[#10243f]",
  heading: "mt-3 font-black text-[#06479b]",
  question: "mt-2 font-bold text-[#10243f]",
  option: "pl-4 text-[#404756]",
  answer: "pl-4 font-semibold text-emerald-700",
  detail: "pl-4 text-[#5e7086]",
} as const;

/** How to lay out a bulk-upload file, with Word and Excel templates to start from. */
export function ImportFormatGuide({ subject, topic, defaultOpen = false }: { subject: string; topic?: string; defaultOpen?: boolean }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<"" | "word" | "excel">("");

  const download = async (kind: "word" | "excel") => {
    setError("");
    setBusy(kind);
    try {
      const images = await loadTemplateImages();
      if (kind === "word") {
        downloadFile(await buildWordTemplate(subject, images), `${subject} question template.docx`, "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
      } else {
        downloadFile(await buildExcelTemplate(subject, images, topic), `${subject} question template.xlsx`, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      }
    } catch {
      setError("The template could not be downloaded. Please try again.");
    } finally {
      setBusy("");
    }
  };

  return (
    <details open={defaultOpen} className="rounded-lg border border-[#d5e2f0] bg-[#f8fbff] p-4 text-left">
      <summary className="cursor-pointer text-sm font-black text-[#06479b]">How to format a bulk upload · Word and Excel templates</summary>
      <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-[#5e7086]">Word layout</p>
          <div className="mt-2 rounded-md border border-[#d5e2f0] bg-white p-4 font-mono text-xs leading-6" aria-label="Example Word question paper">
            {templateLines().map((line, index) => line.kind === "picture"
              ? <Diagram key={index} image={line.image} />
              : <p key={index} className={lineStyle[line.kind]}>
                {line.text.includes("$") ? <MathContent>{line.text}</MathContent> : line.text}
                {line.kind === "option" && line.image && <Diagram image={line.image} inline />}
              </p>)}
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-[#5e7086]">Tips</p>
            <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-[#10243f]">
              {templateTips.map((tip) => <li key={tip}>{tip}</li>)}
            </ul>
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-[#5e7086]">Start from a template</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button type="button" disabled={Boolean(busy)} onClick={() => void download("word")}
                className="inline-flex min-h-10 items-center gap-2 rounded-md border border-[#8dbcf5] bg-white px-4 text-sm font-bold text-[#06479b] transition hover:bg-[#edf5ff] disabled:opacity-60">
                <FileText size={16} aria-hidden="true" /> {busy === "word" ? "Preparing…" : "Word template (.docx)"}
              </button>
              <button type="button" disabled={Boolean(busy)} onClick={() => void download("excel")}
                className="inline-flex min-h-10 items-center gap-2 rounded-md border border-[#9fd8ae] bg-white px-4 text-sm font-bold text-[#087c22] transition hover:bg-emerald-50 disabled:opacity-60">
                <FileSpreadsheet size={16} aria-hidden="true" /> {busy === "excel" ? "Preparing…" : "Excel template (.xlsx)"}
              </button>
            </div>
            <p className="mt-2 text-xs text-[#5e7086]">Excel: one question per row. Type is objective, mcq or theory; MCQ answers list every correct letter, e.g. A, C. Paste pictures into the question or option cell. Add an answerBox column set to yes for an explanation box.</p>
            {error && <p role="alert" className="mt-2 text-sm font-bold text-rose-700">{error}</p>}
          </div>
        </div>
      </div>
    </details>
  );
}

function Diagram({ image, inline = false }: { image: TemplateImage; inline?: boolean }) {
  const { file, width, height, label } = templateImages[image];
  const scale = inline ? 0.35 : 0.6;
  // eslint-disable-next-line @next/next/no-img-element
  return <img className={inline ? "ml-2 inline-block align-middle" : "my-1 ml-4 block"} src={`/question-templates/${file}`} alt={label}
    width={Math.round(width * scale)} height={Math.round(height * scale)} />;
}
