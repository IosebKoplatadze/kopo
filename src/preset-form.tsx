import { Action, ActionPanel, Form, useNavigation } from "@raycast/api";
import { getPresets, newId, savePresets, type OutputMode, type Preset } from "./lib/kopo";

interface FormValues {
  name: string;
  instruction: string;
  systemPrompt: string;
  model: string;
  mode: string;
}

export function PresetForm({ preset, onSaved }: { preset?: Preset; onSaved: () => void }) {
  const { pop } = useNavigation();

  async function submit(values: FormValues) {
    const presets = await getPresets();
    const data = {
      name: values.name.trim() || "Untitled",
      instruction: values.instruction,
      systemPrompt: values.systemPrompt,
      model: values.model.trim(),
      mode: (values.mode === "modal" ? "modal" : "paste") as OutputMode,
    };
    if (preset) {
      const idx = presets.findIndex((p) => p.id === preset.id);
      if (idx >= 0) presets[idx] = { ...preset, ...data };
    } else {
      presets.push({ id: newId(), ...data });
    }
    await savePresets(presets);
    onSaved();
    pop();
  }

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title={preset ? "Save Preset" : "Create Preset"} onSubmit={submit} />
        </ActionPanel>
      }
    >
      <Form.TextField id="name" title="Name" defaultValue={preset?.name} placeholder="Slack message" />
      <Form.TextArea
        id="instruction"
        title="Instruction"
        defaultValue={preset?.instruction ?? "{text}"}
        info="How to rewrite the selection. Use {text} where the selected text goes (appended if omitted)."
      />
      <Form.TextArea
        id="systemPrompt"
        title="System Prompt"
        defaultValue={preset?.systemPrompt ?? "You rewrite the user's text. Output only the rewritten text — no preamble, no quotes, no commentary."}
      />
      <Form.TextField id="model" title="Model" defaultValue={preset?.model ?? ""} placeholder="sonnet, opus, or blank for default" />
      <Form.Dropdown id="mode" title="Output" defaultValue={preset?.mode ?? "paste"}>
        <Form.Dropdown.Item value="paste" title="Paste back over selection" />
        <Form.Dropdown.Item value="modal" title="Show in a modal" />
      </Form.Dropdown>
    </Form>
  );
}
