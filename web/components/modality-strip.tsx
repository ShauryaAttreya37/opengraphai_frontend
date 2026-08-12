import { modalities } from "@/lib/site";
import { modalityText } from "./modality";

export function ModalityStrip() {
  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {modalities.map((m) => (
        <li key={m.id} className="card flex flex-col gap-4 p-5">
          <div className="flex items-baseline justify-between">
            <span aria-hidden className={`text-lg leading-none ${modalityText[m.id]}`}>
              {m.glyph}
            </span>
            <span className="readout text-muted-soft">
              {m.status === "shipped" ? "v0" : "planned"}
            </span>
          </div>
          <div>
            <p
              className={`text-[1.0625rem] ${m.status === "planned" ? "text-muted" : "text-ink"}`}
            >
              {m.name}
            </p>
            <p className="mt-1 font-mono text-[0.75rem] text-muted-soft">{m.pkg}</p>
          </div>
          <dl className="mt-auto space-y-2.5 border-t border-hairline pt-4">
            <div>
              <dt className="readout text-muted-soft">Takes</dt>
              <dd className="mt-1 text-[0.875rem] text-body">{m.accepts}</dd>
            </div>
            <div>
              <dt className="readout text-muted-soft">Yields</dt>
              <dd className="mt-1 text-[0.875rem] text-body">{m.extracts}</dd>
            </div>
          </dl>
        </li>
      ))}
    </ul>
  );
}
