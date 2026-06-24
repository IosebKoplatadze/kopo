import { Clipboard, getSelectedText, showHUD } from "@raycast/api";
import { rephrase } from "./rephrase";

export default async function main() {
  try {
    const selected = await getSelectedText();
    await showHUD("Rephrasing…");
    await Clipboard.paste(await rephrase(selected)); // replaces the selection
    await showHUD("Rephrased ✓");
  } catch (e) {
    await showHUD(e instanceof Error ? e.message : "Something went wrong");
  }
}
