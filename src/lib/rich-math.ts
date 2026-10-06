import { InputRule } from "@tiptap/react";
import { InlineMath } from "@tiptap/extension-mathematics";
import katex from "katex";
import { parseMathSegments } from "./math-segments";

function mathToken(source: string) {
  const segment = parseMathSegments(source)[0];
  if (!segment || segment.type !== "math") return;
  const size = source.startsWith("$$") || source.startsWith("\\") ? 2 : 1;
  if (segment.start !== size) return;
  return {
    type: "inlineMath", raw: source.slice(0, segment.end + size),
    latex: segment.value, display: segment.display,
  };
}

// Display equations are inline atoms with a block appearance. This also preserves
// existing question strings containing $$...$$ in the middle of a paragraph.
export const RichMath = InlineMath.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      display: {
        default: false,
        parseHTML: (element) => element.getAttribute("data-display") === "true",
        renderHTML: (attributes) => ({ "data-display": String(attributes.display) }),
      },
    };
  },
  parseMarkdown(token) {
    return { type: this.name, attrs: { latex: token.latex, display: token.display ?? false } };
  },
  renderMarkdown(node) {
    const delimiter = node.attrs?.display ? "$$" : "$";
    return `${delimiter}${node.attrs?.latex ?? ""}${delimiter}`;
  },
  markdownTokenizer: {
    name: "inlineMath", level: "inline",
    start(source) {
      const positions = ["$", "\\(", "\\["].map((open) => source.indexOf(open)).filter((position) => position >= 0);
      return positions.length ? Math.min(...positions) : -1;
    },
    tokenize: mathToken,
  },
  addInputRules() {
    return [new InputRule({
      find: (text) => {
        for (const segment of parseMathSegments(text)) {
          if (segment.type !== "math") continue;
          const before = text.slice(Math.max(0, segment.start - 2), segment.start);
          const size = ["$$", "\\(", "\\["].includes(before) ? 2 : 1;
          if (segment.end + size !== text.length || !segment.value.trim()) continue;
          const start = segment.start - size;
          return { index: start, text: text.slice(start), data: { latex: segment.value, display: segment.display } };
        }
        return null;
      },
      handler: ({ state, range, match }) => {
        state.tr.replaceWith(range.from, range.to, this.type.create(match.data));
      },
    })];
  },
  addNodeView() {
    return ({ node, getPos }) => {
      const dom = document.createElement("span");
      dom.className = "rich-math";
      dom.contentEditable = "false";
      dom.dataset.type = "inline-math";
      dom.dataset.display = String(node.attrs.display);
      dom.dataset.latex = node.attrs.latex;
      dom.setAttribute("role", "button");
      dom.setAttribute("aria-label", `Edit equation: ${node.attrs.latex}`);
      dom.tabIndex = 0;
      katex.render(node.attrs.latex, dom, { displayMode: node.attrs.display, throwOnError: false, trust: false });
      const edit = () => {
        const pos = getPos();
        if (this.editor.isEditable && pos != null) this.options.onClick?.(node, pos);
      };
      const click = (event: MouseEvent) => { event.preventDefault(); event.stopPropagation(); edit(); };
      const keydown = (event: KeyboardEvent) => {
        if (event.key === "Enter" || event.key === " ") { event.preventDefault(); event.stopPropagation(); edit(); }
      };
      dom.addEventListener("click", click);
      dom.addEventListener("keydown", keydown);
      return {
        dom,
        stopEvent: (event) => event.type === "click" || (event.type === "keydown" && ["Enter", " "].includes((event as KeyboardEvent).key)),
        ignoreMutation: () => true,
        destroy: () => { dom.removeEventListener("click", click); dom.removeEventListener("keydown", keydown); },
      };
    };
  },
});
