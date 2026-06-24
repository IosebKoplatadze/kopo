import { Action, ActionPanel, Detail, getSelectedText } from "@raycast/api";
import { useEffect, useState } from "react";

// ponytail: same placeholder transform as the paste-back command.
function adjust(text: string): string {
  return text.toUpperCase();
}

export default function Command() {
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    getSelectedText()
      .then((t) => setResult(adjust(t)))
      .catch(() => setError(true));
  }, []);

  if (error) return <Detail markdown="**Select some text first**" />;

  return (
    <Detail
      isLoading={result === null}
      markdown={result ?? ""}
      actions={
        result ? (
          <ActionPanel>
            <Action.CopyToClipboard content={result} />
            <Action.Paste content={result} />
          </ActionPanel>
        ) : undefined
      }
    />
  );
}
