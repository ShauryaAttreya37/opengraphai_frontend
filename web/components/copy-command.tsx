"use client";

import { useState } from "react";

export function CopyCommand({ command, label }: { command: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="flex items-stretch overflow-hidden rounded-xl border border-hairline bg-surface">
      {label ? (
        <span className="readout hidden items-center border-r border-hairline px-3.5 text-muted sm:flex">
          {label}
        </span>
      ) : null}
      <code className="hide-scrollbar flex-1 overflow-x-auto whitespace-nowrap px-4 py-3 font-mono text-[0.8125rem] text-ink">
        <span className="mr-2 select-none text-muted-soft">$</span>
        {command}
      </code>
      <button
        type="button"
        onClick={copy}
        className="shrink-0 border-l border-hairline px-4 text-[0.8125rem] font-medium text-muted transition-colors hover:bg-surface-strong hover:text-ink"
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
