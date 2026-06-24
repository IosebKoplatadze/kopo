import { Clipboard, getSelectedText, showHUD } from "@raycast/api";
import { getPresets, rephrase } from "./kopo";

// Runs the preset at the given position on the current selection and pastes
// it back. Used by the no-view slot commands so each gets a global hotkey.
export async function runSlot(index: number): Promise<void> {
  const presets = await getPresets();
  const preset = presets[index];
  if (!preset) {
    await showHUD(`Kopo: no preset in slot ${index + 1}`);
    return;
  }
  let text: string;
  try {
    text = await getSelectedText();
  } catch {
    await showHUD("Select some text first");
    return;
  }
  await showHUD(`Rephrasing — ${preset.name}…`);
  try {
    await Clipboard.paste(await rephrase(preset, text));
    await showHUD("Rephrased ✓");
  } catch (e) {
    await showHUD(e instanceof Error ? e.message : "Something went wrong");
  }
}
