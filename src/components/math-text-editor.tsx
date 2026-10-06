"use client";

import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import katex from "katex";
import {
  Bold, Code2, Heading2, Heading3, Heading4, ImageIcon, Italic, Link,
  List, ListOrdered, Quote, Redo2, Sigma, Strikethrough, Subscript,
  Superscript, Underline, Undo2,
} from "lucide-react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "@tiptap/markdown";
import { closeHistory } from "@tiptap/pm/history";
import { RichMath } from "@/lib/rich-math";

const tools = [
  { label: "Bold", command: "bold", icon: Bold },
  { label: "Italic", command: "italic", icon: Italic },
  { label: "Underline", command: "underline", icon: Underline },
  { label: "Strikethrough", command: "strike", icon: Strikethrough },
  { label: "Code", command: "code", icon: Code2 },
  { label: "Heading 2", command: "h2", icon: Heading2 },
  { label: "Heading 3", command: "h3", icon: Heading3 },
  { label: "Heading 4", command: "h4", icon: Heading4 },
  { label: "Bullet list", command: "bullet", icon: List },
  { label: "Numbered list", command: "numbered", icon: ListOrdered },
  { label: "Quote", command: "quote", icon: Quote },
  { label: "Link", command: "link", icon: Link },
  { label: "Superscript", command: "superscript", icon: Superscript },
  { label: "Subscript", command: "subscript", icon: Subscript },
  { label: "Image note", command: "image", icon: ImageIcon },
  { label: "Undo", command: "undo", icon: Undo2 },
  { label: "Redo", command: "redo", icon: Redo2 },
  { label: "Equation", command: "equation", icon: Sigma },
] as const;

const equations = [
  { label: "Fraction", source: "\\frac{a}{b}" },
  { label: "Square root", source: "\\sqrt{x}" },
  { label: "Power", source: "x^{2}" },
  { label: "Subscript", source: "x_{1}" },
  { label: "Integral", source: "\\int_{a}^{b} f(x)\\,dx" },
  { label: "Sum", source: "\\sum_{i=1}^{n} x_i" },
];

type Selection = { from: number; to: number };
type ScriptEditor = Selection & {
  operator: "^" | "_";
  prefix: string;
  suffix: string;
  display: boolean;
};

export function MathTextEditor({ value, onChange, label, placeholder, required = false, disabled = false, imageNote = false, children }: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder: string;
  required?: boolean;
  disabled?: boolean;
  imageNote?: boolean;
  children?: ReactNode;
}) {
  const id = useId();
  const lastValue = useRef(value);
  const [equation, setEquation] = useState<Selection | null>(null);
  const [source, setSource] = useState("x^{2}");
  const [display, setDisplay] = useState(false);
  const [link, setLink] = useState<(Selection & { href: string }) | null>(null);
  const [script, setScript] = useState<ScriptEditor | null>(null);
  const [scriptValue, setScriptValue] = useState("");
  const scriptLabel = script?.operator === "_" ? "Subscript" : "Superscript";
  const equationScripts = (["^", "_"] as const).map((operator) => ({ operator, ...scriptParts(stripDelimiters(source), operator) }));
  const scriptLatex = script ? `${script.prefix}${script.operator}{${scriptValue.trim()}}${script.suffix}` : "";
  const scriptError = useMemo(() => {
    if (!scriptValue.trim()) return "Enter a number, symbol, or expression.";
    try {
      katex.renderToString(scriptLatex, { throwOnError: true, trust: false });
      return "";
    } catch {
      return "Check the value and matching braces.";
    }
  }, [scriptValue, scriptLatex]);
  const expression = stripDelimiters(source);
  const equationError = useMemo(() => {
    if (!expression) return "Enter an equation.";
    try {
      katex.renderToString(expression, { throwOnError: true, trust: false });
      return "";
    } catch {
      return "Check your LaTeX commands and matching braces.";
    }
  }, [expression]);

  const editor: Editor | null = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3, 4] }, link: { openOnClick: false } }),
      Markdown.configure({ markedOptions: { breaks: true } }),
      RichMath.configure({ onClick: (node, pos) => {
        setSource(node.attrs.latex);
        setDisplay(node.attrs.display);
        setEquation({ from: pos, to: pos + node.nodeSize });
      } }),
    ],
    content: value,
    contentType: "markdown",
    editable: !disabled,
    editorProps: {
      attributes: {
        id, role: "textbox", "aria-label": label, "aria-multiline": "true",
        "aria-required": String(required), "aria-describedby": `${id}-help`,
        "data-placeholder": placeholder, class: "rich-text-input",
      },
      handlePaste: (_view, event) => {
        const text = event.clipboardData?.getData("text/plain");
        if (!text) return false;
        event.preventDefault();
        editor?.commands.insertContent(text, { contentType: "markdown" });
        return true;
      },
      clipboardTextSerializer: (slice) => editor?.markdown?.serialize({ type: "doc", content: slice.content.toJSON() }) ?? "",
    },
    onUpdate: ({ editor: current }) => {
      const next = current.getMarkdown();
      lastValue.current = next;
      onChange(next);
    },
  });

  useEffect(() => {
    if (!editor || value === lastValue.current) return;
    editor.commands.setContent(value, { contentType: "markdown", emitUpdate: false });
    lastValue.current = value;
  }, [editor, value]);

  useEffect(() => {
    editor?.setEditable(!disabled && !equation && !link && !script);
  }, [editor, disabled, equation, link, script]);

  const openEquation = () => {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    const node = editor.state.doc.nodeAt(from);
    const selectedMath = from !== to && node?.type.name === "inlineMath";
    setSource(selectedMath ? node.attrs.latex : stripDelimiters(editor.state.doc.textBetween(from, to)) || "x^{2}");
    setDisplay(selectedMath ? node.attrs.display : false);
    setEquation({ from, to });
  };
  const closePanel = () => {
    setEquation(null);
    setLink(null);
    setScript(null);
    editor?.commands.focus();
  };
  const applyEquation = () => {
    if (!equation || disabled || equationError) return;
    editor?.chain().focus().command(({ tr }) => { closeHistory(tr); return true; }).insertContentAt(equation, {
      type: "inlineMath", attrs: { latex: expression, display },
    }).run();
    closePanel();
  };
  const openScript = (operator: "^" | "_") => {
    if (!editor) return;
    let { from } = editor.state.selection;
    let { to } = editor.state.selection;
    const selectedNode = editor.state.doc.nodeAt(from);
    const before = editor.state.selection.$from.nodeBefore;
    let mathNode = from !== to && selectedNode?.type.name === "inlineMath" && to - from === selectedNode.nodeSize ? selectedNode : null;
    if (from === to && before?.type.name === "inlineMath") {
      mathNode = before;
      from -= before.nodeSize;
      to = from + before.nodeSize;
    } else if (from === to) {
      const prefix = editor.state.selection.$from.parent.textBetween(0, editor.state.selection.$from.parentOffset);
      from -= prefix.match(/[A-Za-z0-9]+$/)?.[0].length ?? 0;
    }
    const latex = mathNode?.attrs.latex ?? (editor.state.doc.textBetween(from, to) || "x");
    const parts = scriptParts(latex, operator);
    setScriptValue(parts.value);
    setScript({ from, to, operator, prefix: parts.prefix, suffix: parts.suffix, display: mathNode?.attrs.display ?? false });
  };
  const applyScript = () => {
    if (!script || disabled || scriptError) return;
    editor?.chain().focus().command(({ tr }) => { closeHistory(tr); return true; }).insertContentAt({ from: script.from, to: script.to }, {
      type: "inlineMath", attrs: { latex: scriptLatex, display: script.display },
    }).run();
    closePanel();
  };
  const applyTool = (command: typeof tools[number]["command"]) => {
    if (!editor) return;
    const chain = editor.chain().focus();
    switch (command) {
      case "bold": return chain.toggleBold().run();
      case "italic": return chain.toggleItalic().run();
      case "underline": return chain.toggleUnderline().run();
      case "strike": return chain.toggleStrike().run();
      case "code": return chain.toggleCode().run();
      case "h2": return chain.toggleHeading({ level: 2 }).run();
      case "h3": return chain.toggleHeading({ level: 3 }).run();
      case "h4": return chain.toggleHeading({ level: 4 }).run();
      case "bullet": return chain.toggleBulletList().run();
      case "numbered": return chain.toggleOrderedList().run();
      case "quote": return chain.toggleBlockquote().run();
      case "link": return setLink({ from: editor.state.selection.from, to: editor.state.selection.to, href: editor.getAttributes("link").href ?? "https://" });
      case "superscript": return openScript("^");
      case "subscript": return openScript("_");
      case "image": return chain.insertContent("[image: describe your diagram]").run();
      case "undo": return chain.undo().run();
      case "redo": return chain.redo().run();
      case "equation": return openEquation();
    }
  };
  const active = (command: typeof tools[number]["command"]) => {
    if (!editor) return false;
    const names: Record<string, string> = { strike: "strike", bullet: "bulletList", numbered: "orderedList", quote: "blockquote", equation: "inlineMath" };
    if (["h2", "h3", "h4"].includes(command)) return editor.isActive("heading", { level: Number(command.slice(1)) });
    return editor.isActive(names[command] ?? command);
  };
  const panelOpen = Boolean(equation || link || script);

  return (
    <div className="focus-glow overflow-hidden rounded-lg border border-sky-300 bg-white shadow-sm shadow-sky-100 transition focus-within:border-emerald-500">
      <div role="group" aria-label={`${label} formatting`} className="flex min-h-10 flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50 px-3 py-2">
        {tools.filter((tool) => imageNote || tool.command !== "image").map(({ label: toolLabel, command, icon: Icon }) => (
          <button aria-label={toolLabel} aria-pressed={active(command)} title={toolLabel} type="button" key={command}
            className={`grid h-8 w-8 place-items-center rounded-md transition hover:-translate-y-0.5 hover:bg-white hover:text-sky-700 focus:outline-none focus:ring-2 focus:ring-emerald-300 disabled:opacity-40 ${active(command) ? "bg-sky-100 text-sky-800" : "text-slate-500"}`}
            disabled={disabled || panelOpen || !editor} onMouseDown={(event) => { if (event.button === 0) event.preventDefault(); }} onClick={() => applyTool(command)}>
            <Icon aria-hidden="true" size={15} strokeWidth={2.1} />
          </button>
        ))}
      </div>
      {script && <section aria-label={`${scriptLabel} editor`} className="grid gap-3 border-b border-sky-200 bg-sky-50 p-4 text-sm font-medium">
        <strong>Set {scriptLabel.toLowerCase()}</strong>
        <label className="grid gap-1" htmlFor={`${id}-script`}>{scriptLabel} value
          <input id={`${id}-script`} aria-label={`${scriptLabel} value`} autoFocus disabled={disabled}
            className="rounded border border-sky-200 bg-white p-2 font-normal outline-none focus:ring-2 focus:ring-sky-300"
            value={scriptValue} placeholder="e.g. 3, -1, n+1" onFocus={(event) => event.currentTarget.select()}
            onChange={(event) => setScriptValue(event.target.value)} onKeyDown={(event) => {
              if (event.key === "Enter") { event.preventDefault(); applyScript(); }
              if (event.key === "Escape") { event.preventDefault(); closePanel(); }
            }} />
        </label>
        {scriptValue.trim() && scriptError && <p role="status" className="text-rose-700">{scriptError}</p>}
        <div className="flex gap-2">
          <button type="button" disabled={disabled || Boolean(scriptError)} className="rounded bg-sky-700 px-3 py-2 font-bold text-white disabled:opacity-40" onClick={applyScript}>Apply {scriptLabel.toLowerCase()}</button>
          <button type="button" disabled={disabled} className="rounded border border-sky-200 bg-white px-3 py-2" onClick={closePanel}>Cancel {scriptLabel.toLowerCase()}</button>
        </div>
      </section>}
      {equation && <section aria-label="Equation editor" className="grid gap-3 border-b border-sky-200 bg-sky-50 p-4 text-sm font-medium">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <strong>Edit equation</strong>
          <label className="flex items-center gap-2">Layout
            <select aria-label="Equation layout" value={display ? "display" : "inline"} disabled={disabled}
              className="rounded border border-sky-200 bg-white px-2 py-1" onChange={(event) => setDisplay(event.target.value === "display")}>
              <option value="inline">Inline</option><option value="display">Display equation</option>
            </select>
          </label>
        </div>
        <div className="flex flex-wrap gap-2">{equations.map((template) => <button key={template.label} disabled={disabled} type="button" className="rounded border border-sky-200 bg-white px-2 py-1 text-sky-800 hover:bg-sky-100" onClick={() => setSource(template.source)}>{template.label}</button>)}</div>
        <label htmlFor={`${id}-equation`}>LaTeX equation</label>
        <textarea id={`${id}-equation`} aria-label="LaTeX equation" autoFocus value={source} rows={2} disabled={disabled}
          className="w-full resize-y rounded border border-sky-200 bg-white p-2 font-mono font-normal outline-none focus:ring-2 focus:ring-sky-300"
          onChange={(event) => setSource(event.target.value)} onKeyDown={(event) => { if (event.key === "Escape") { event.preventDefault(); closePanel(); } }} />
        <div className="grid gap-3 sm:grid-cols-2">
          {equationScripts.filter((part) => part.found).map((part) => {
            const name = part.operator === "^" ? "Superscript" : "Subscript";
            return <label key={part.operator} className="grid gap-1">{name} value
              <input aria-label={`${name} value`} value={part.value} disabled={disabled}
                className="rounded border border-sky-200 bg-white p-2 font-normal outline-none focus:ring-2 focus:ring-sky-300"
                onFocus={(event) => event.currentTarget.select()}
                onChange={(event) => setSource(`${part.prefix}${part.operator}{${event.target.value}}${part.suffix}`)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") { event.preventDefault(); applyEquation(); }
                  if (event.key === "Escape") { event.preventDefault(); closePanel(); }
                }} />
            </label>;
          })}
        </div>
        {equationError && <p role="status" className="text-rose-700">{equationError}</p>}
        <div className="flex gap-2">
          <button type="button" disabled={disabled || Boolean(equationError)} className="rounded bg-sky-700 px-3 py-2 font-bold text-white disabled:opacity-40" onClick={applyEquation}>Apply equation</button>
          <button type="button" disabled={disabled} className="rounded border border-sky-200 bg-white px-3 py-2" onClick={closePanel}>Cancel equation</button>
        </div>
      </section>}
      {link && <section aria-label="Link editor" className="flex flex-wrap items-end gap-2 border-b border-sky-200 bg-sky-50 p-4 text-sm">
        <label className="grid flex-1 gap-1">Link URL<input autoFocus aria-label="Link URL" className="rounded border border-sky-200 bg-white p-2" type="url" value={link.href} onChange={(event) => setLink({ ...link, href: event.target.value })} /></label>
        <button type="button" disabled={!/^(https?:\/\/[^\s]+|mailto:[^\s]+)$/i.test(link.href)} className="rounded bg-sky-700 px-3 py-2 font-bold text-white disabled:opacity-40" onClick={() => {
          const chain = editor?.chain().focus().setTextSelection({ from: link.from, to: link.to });
          if (link.from === link.to) chain?.insertContent({ type: "text", text: link.href, marks: [{ type: "link", attrs: { href: link.href } }] }).run();
          else chain?.setLink({ href: link.href }).run();
          closePanel();
        }}>Apply link</button>
        <button type="button" className="rounded border border-sky-200 bg-white px-3 py-2" onClick={() => { editor?.chain().focus().setTextSelection(link).extendMarkRange("link").unsetLink().run(); closePanel(); }}>Remove link</button>
        <button type="button" className="rounded border border-sky-200 bg-white px-3 py-2" onClick={closePanel}>Cancel link</button>
      </section>}
      <EditorContent editor={editor} />
      {!editor && <div className="min-h-44 px-4 py-4 text-base text-slate-400">{placeholder}</div>}
      <p id={`${id}-help`} className="px-4 pb-3 text-xs font-normal text-slate-500">Use the Equation tool, or type $...$ to insert math. Click an equation to edit it.</p>
      {children}
    </div>
  );
}

// Replace an existing script at the outer brace level, retaining the other
// script and the rest of the equation (for example, x_{i}^{2} + 1).
function scriptParts(latex: string, operator: "^" | "_") {
  let depth = 0;
  for (let index = 0; index < latex.length; index += 1) {
    const character = latex[index];
    if (character === "\\") { index += 1; continue; }
    if (character === "{") depth += 1;
    if (character === "}") depth -= 1;
    if (depth !== 0 || character !== operator) continue;
    let start = index + 1;
    while (/\s/.test(latex[start] ?? "") && start < latex.length) start += 1;
    let end = start;
    let value = "";
    if (latex[start] === "{") {
      let argumentDepth = 1;
      for (end = start + 1; end < latex.length; end += 1) {
        if (latex[end] === "\\") { end += 1; continue; }
        if (latex[end] === "{") argumentDepth += 1;
        if (latex[end] === "}") argumentDepth -= 1;
        if (argumentDepth === 0) break;
      }
      if (argumentDepth !== 0) continue;
      value = latex.slice(start + 1, end);
      end += 1;
    } else {
      const argument = latex.slice(start).match(/^\\[A-Za-z]+|^\\.|^./)?.[0];
      if (!argument) continue;
      value = argument;
      end += argument.length;
    }
    return { prefix: latex.slice(0, index), suffix: latex.slice(end), value, found: true };
  }
  return { prefix: latex, suffix: "", value: "", found: false };
}

function stripDelimiters(value: string) {
  const trimmed = value.trim();
  for (const [open, close] of [["$$", "$$"], ["$", "$"], ["\\(", "\\)"] , ["\\[", "\\]"]]) {
    if (trimmed.startsWith(open) && trimmed.endsWith(close) && trimmed.length >= open.length + close.length) return trimmed.slice(open.length, -close.length).trim();
  }
  return trimmed;
}
