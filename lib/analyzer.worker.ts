import { parseWhatsAppFile } from "./parser";
import { computeAnalytics } from "./analytics";

/* eslint-disable-next-line no-restricted-globals */
const ctx: Worker = self as any;

ctx.addEventListener("message", async (event: MessageEvent) => {
  const { action, text } = event.data;

  if (action === "parseAndAnalyze") {
    try {
      // 1. Parsing phase (0% - 50%)
      const messages = await parseWhatsAppFile(text, (progress) => {
        ctx.postMessage({
          type: "progress",
          progress: Math.floor(progress * 0.5),
        });
      });

      if (messages.length === 0) {
        throw new Error("No messages found. Are you sure this is a WhatsApp export?");
      }

      ctx.postMessage({
        type: "progress",
        progress: 50,
      });

      // 2. Analytics phase (50% - 100%)
      const stats = await computeAnalytics(messages, (progress) => {
        ctx.postMessage({
          type: "progress",
          progress: 50 + Math.floor(progress * 0.5),
        });
      });

      // 3. Send final success message with structured results
      ctx.postMessage({
        type: "success",
        messages,
        stats,
      });
    } catch (err: any) {
      ctx.postMessage({
        type: "error",
        error: err.message || "An error occurred during analysis.",
      });
    }
  }
});
