import {
  Action,
  ActionPanel,
  Clipboard,
  Detail,
  Icon,
  Keyboard,
  List,
  Toast,
  getSelectedText,
  showHUD,
  showToast,
  useNavigation,
} from "@raycast/api";
import { useEffect, useState } from "react";
import { getPresets, rephrase, savePresets, type Preset } from "./lib/kopo";
import { PresetForm } from "./preset-form";

export default function Command() {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [loading, setLoading] = useState(true);
  const { push } = useNavigation();

  async function reload() {
    setPresets(await getPresets());
    setLoading(false);
  }
  useEffect(() => {
    reload();
  }, []);

  async function run(preset: Preset) {
    let text: string;
    try {
      text = await getSelectedText();
    } catch {
      await showHUD("Select some text first");
      return;
    }
    const toast = await showToast({ style: Toast.Style.Animated, title: `Rephrasing — ${preset.name}…` });
    try {
      const result = await rephrase(preset, text);
      if (preset.mode === "modal") {
        await toast.hide();
        push(<Result text={result} />);
      } else {
        await Clipboard.paste(result);
        await toast.hide();
        await showHUD("Rephrased ✓");
      }
    } catch (e) {
      toast.style = Toast.Style.Failure;
      toast.title = e instanceof Error ? e.message : "Something went wrong";
    }
  }

  async function reorder(index: number, dir: -1 | 1) {
    const next = [...presets];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    await savePresets(next);
    setPresets(next);
  }

  async function remove(preset: Preset) {
    const next = presets.filter((p) => p.id !== preset.id);
    await savePresets(next);
    setPresets(next);
  }

  return (
    <List isLoading={loading} searchBarPlaceholder="Search presets — Enter rephrases the selection">
      {presets.map((preset, i) => (
        <List.Item
          key={preset.id}
          icon={Icon.Wand}
          title={preset.name}
          subtitle={preset.instruction}
          accessories={[
            ...(preset.model ? [{ tag: preset.model }] : []),
            { text: i < 5 ? `slot ${i + 1}` : preset.mode },
          ]}
          actions={
            <ActionPanel>
              <Action title="Rephrase Selection" icon={Icon.Wand} onAction={() => run(preset)} />
              <Action.Push
                title="Edit Preset"
                icon={Icon.Pencil}
                target={<PresetForm preset={preset} onSaved={reload} />}
                shortcut={Keyboard.Shortcut.Common.Edit}
              />
              <Action.Push
                title="Create Preset"
                icon={Icon.Plus}
                target={<PresetForm onSaved={reload} />}
                shortcut={Keyboard.Shortcut.Common.New}
              />
              <Action.Push
                title="Duplicate Preset"
                icon={Icon.CopyClipboard}
                target={<PresetForm preset={{ ...preset, name: `${preset.name} copy` }} onSaved={reload} />}
                shortcut={Keyboard.Shortcut.Common.Duplicate}
              />
              <Action
                title="Move Up"
                icon={Icon.ArrowUp}
                onAction={() => reorder(i, -1)}
                shortcut={{ modifiers: ["cmd", "opt"], key: "arrowUp" }}
              />
              <Action
                title="Move Down"
                icon={Icon.ArrowDown}
                onAction={() => reorder(i, 1)}
                shortcut={{ modifiers: ["cmd", "opt"], key: "arrowDown" }}
              />
              <Action
                title="Delete Preset"
                icon={Icon.Trash}
                style={Action.Style.Destructive}
                onAction={() => remove(preset)}
                shortcut={Keyboard.Shortcut.Common.Remove}
              />
            </ActionPanel>
          }
        />
      ))}
      {!loading && presets.length === 0 && (
        <List.EmptyView
          title="No presets yet"
          description="Create one to start rephrasing"
          icon={Icon.Wand}
          actions={
            <ActionPanel>
              <Action.Push title="Create Preset" icon={Icon.Plus} target={<PresetForm onSaved={reload} />} />
            </ActionPanel>
          }
        />
      )}
    </List>
  );
}

function Result({ text }: { text: string }) {
  return (
    <Detail
      markdown={text}
      actions={
        <ActionPanel>
          <Action.CopyToClipboard content={text} />
          <Action.Paste content={text} />
        </ActionPanel>
      }
    />
  );
}
