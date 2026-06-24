import { Clipboard, getSelectedText, showHUD } from "@raycast/api";

// ponytail: transform is a placeholder (uppercase). Swap this one function for
// your real adjustment (LLM call, regex cleanup, case change, etc.).
function adjust(text: string): string {
  return text.toUpperCase();
}

export default async function main() {
  try {
    const selected = await getSelectedText();
    const result = adjust(selected);
    await Clipboard.paste(result); // replaces the selection in the active app
    await showHUD("Adjusted ✓");
  } catch {
    await showHUD("Select some text first");
  }
}
