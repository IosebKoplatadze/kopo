import { Action, ActionPanel, Detail, getSelectedText } from "@raycast/api";
import { useEffect, useState } from "react";
import { rephrase } from "./rephrase";

export default function Command() {
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getSelectedText()
      .then(rephrase)
      .then(setResult)
      .catch((e) => setError(e instanceof Error ? e.message : "Something went wrong"));
  }, []);

  if (error) return <Detail markdown={`**${error}**`} />;

  return (
    <Detail
      isLoading={result === null}
      markdown={result ?? "Rephrasing…"}
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
