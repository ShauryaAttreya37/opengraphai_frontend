"use client";

import { useState } from "react";
import { stages } from "@/lib/site";

type Layer = "local" | "cloud";

export function PipelineMap({ compact = false }: { compact?: boolean }) {
  const [activeId, setActiveId] = useState(stages[1].id);
  const [layer, setLayer] = useState<Layer>("local");
  const active = stages.find((stage) => stage.id === activeId) ?? stages[0];
  const activeIndex = stages.findIndex((stage) => stage.id === activeId);

  return (
    <div>
      {!compact ? (
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <span className="readout text-muted-soft">Path</span>
          <div className="flex items-center rounded-full border border-hairline bg-surface p-0.5">
            {(
              [
                { id: "local", label: "Local package" },
                { id: "cloud", label: "Cloud engine" },
              ] as const
            ).map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setLayer(option.id)}
                aria-pressed={layer === option.id}
                className={`rounded-full px-3.5 py-1.5 text-[0.8125rem] font-medium transition-colors ${
                  layer === option.id ? "bg-ink-strong text-on-ink" : "text-muted hover:text-ink"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {/* Sequence is real: stage n consumes stage n-1's output. */}
      <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        {stages.map((stage, i) => {
          const isActive = stage.id === activeId;
          const isPast = i < activeIndex;
          return (
            <li key={stage.id}>
              <button
                type="button"
                onClick={() => setActiveId(stage.id)}
                onMouseEnter={() => setActiveId(stage.id)}
                aria-current={isActive ? "step" : undefined}
                className={`flex h-full w-full flex-col gap-2.5 rounded-xl border p-4 text-left transition-colors ${
                  isActive
                    ? "border-hairline-strong bg-surface"
                    : "border-hairline bg-transparent hover:bg-surface"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className={`h-1.5 w-1.5 shrink-0 rounded-full transition-colors ${
                      isActive ? "bg-ink" : isPast ? "bg-hairline-strong" : "bg-hairline-strong/60"
                    }`}
                  />
                  <span className="readout text-muted-soft">
                    {String(stage.n).padStart(2, "0")}
                  </span>
                </span>
                <span
                  className={`text-[0.9375rem] font-medium transition-colors ${
                    isActive ? "text-ink" : "text-body"
                  }`}
                >
                  {stage.title}
                </span>
                <span className="text-[0.8125rem] leading-snug text-muted">{stage.summary}</span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="card mt-3 p-6 sm:p-7">
        <div className="grid gap-7 lg:grid-cols-[1.5fr_1fr]">
          <div>
            <p className="readout text-muted-soft">
              Stage {String(active.n).padStart(2, "0")} · {active.title}
            </p>
            <p className="lede mt-3 max-w-[62ch]">{active.detail}</p>
            {!compact ? (
              <p className="mt-5 border-l border-hairline-strong pl-4 text-[0.9375rem] leading-relaxed text-ink">
                {layer === "local" ? active.local : active.cloud}
              </p>
            ) : null}
          </div>

          <dl className="space-y-5">
            <div>
              <dt className="readout text-muted-soft">Emits</dt>
              <dd className="mt-2 font-mono text-[0.8125rem] text-ink">{active.emits}</dd>
            </div>
            {!compact ? (
              <div>
                <dt className="readout text-muted-soft">Source</dt>
                <dd className="mt-2 space-y-1.5">
                  {active.modules.map((module) => (
                    <p key={module} className="font-mono text-[0.75rem] break-all text-body">
                      {module}
                    </p>
                  ))}
                </dd>
              </div>
            ) : null}
          </dl>
        </div>
      </div>
    </div>
  );
}
