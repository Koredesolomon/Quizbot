export type AnswerAttachment = {
  id: string;
  name: string;
  size: number;
  type: string;
};

export const attachmentDivider = "\n\n--- Attached files ---\n";

export function parseAnswerValue(value: string): { text: string; attachments: AnswerAttachment[] } {
  const [text, attachmentText = ""] = value.split(attachmentDivider);

  return {
    text,
    attachments: attachmentText
      .split("\n")
      .map((line) => {
        const match = line.match(/^\[file:(.+) \((\d+) bytes\) type:(.*) id:(.*)\]$/);
        if (!match) return null;

        return {
          name: match[1],
          size: Number(match[2]),
          type: match[3],
          id: match[4],
        };
      })
      .filter((attachment): attachment is AnswerAttachment => Boolean(attachment)),
  };
}

export function serializeAnswerValue(text: string, attachments: AnswerAttachment[]) {
  if (!attachments.length) return text;

  const attachmentText = attachments
    .map((attachment) => `[file:${attachment.name} (${attachment.size} bytes) type:${attachment.type} id:${attachment.id}]`)
    .join("\n");

  return `${text.trimEnd()}${attachmentDivider}${attachmentText}`;
}

export function dedupeAttachments(attachments: AnswerAttachment[]) {
  return Array.from(new Map(attachments.map((attachment) => [attachment.id, attachment])).values());
}

export function formatBytes(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}
