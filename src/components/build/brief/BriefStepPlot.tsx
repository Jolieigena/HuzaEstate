"use client";

import { useId } from "react";
import dynamic from "next/dynamic";
import { PlotInfo, PlotShape, PlotSlope } from "@/lib/build/types";
import { StepErrors } from "@/lib/build/briefValidation";
import { Field, inputClass, Toggle } from "./FormField";
import FileUploadList from "@/components/build/FileUploadList";

const PlotMapPicker = dynamic(() => import("@/components/build/PlotMapPicker"), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-slate-100 animate-pulse rounded-2xl" />,
});

const SHAPE_OPTIONS: { key: PlotShape; label: string }[] = [
  { key: "rectangular", label: "Rectangular" },
  { key: "square", label: "Square" },
  { key: "irregular", label: "Irregular" },
  { key: "unknown", label: "Not sure" },
];

const SLOPE_OPTIONS: { key: PlotSlope; label: string }[] = [
  { key: "flat", label: "Flat" },
  { key: "gentle", label: "Gentle" },
  { key: "moderate", label: "Moderate" },
  { key: "steep", label: "Steep" },
  { key: "unknown", label: "Not sure" },
];

const UTILITY_OPTIONS = ["Grid electricity nearby", "Piped water nearby", "Sewer connection nearby", "Fibre / internet nearby"];

export default function BriefStepPlot({ value, onChange, errors }: { value: PlotInfo; onChange: (patch: Partial<PlotInfo>) => void; errors: StepErrors }) {
  const ids = { address: useId(), width: useId(), length: useId(), area: useId(), orientation: useId(), road: useId(), existing: useId(), notes: useId() };

  const toggleUtility = (utility: string) => {
    const has = value.utilityAccess.includes(utility);
    onChange({ utilityAccess: has ? value.utilityAccess.filter((u) => u !== utility) : [...value.utilityAccess, utility] });
  };

  return (
    <div className="space-y-6">
      <Field label="Plot address" htmlFor={ids.address} helper="You can also place or move the marker on the map below.">
        <input id={ids.address} type="text" value={value.address} onChange={(e) => onChange({ address: e.target.value })} className={inputClass()} placeholder="e.g. KG 9 Ave, Kigali" />
      </Field>

      <div>
        <p className="text-sm font-bold text-slate-700 mb-1.5">Plot location on map</p>
        <p className="text-xs text-slate-400 mb-2">Click anywhere on the map to place a marker, or drag it once placed. You can skip this if you don&apos;t know the exact location yet.</p>
        <div className="h-72 rounded-2xl overflow-hidden">
          <PlotMapPicker coordinates={value.coordinates} onChange={(coords) => onChange({ coordinates: coords })} />
        </div>
        {value.coordinates && (
          <p className="text-xs text-slate-400 mt-2">
            Coordinates: {value.coordinates.lat.toFixed(5)}, {value.coordinates.lng.toFixed(5)}
          </p>
        )}
      </div>

      <div>
        <p className="text-sm font-bold text-slate-700 mb-2">Plot shape</p>
        <div className="flex flex-wrap gap-2">
          {SHAPE_OPTIONS.map((opt) => (
            <Toggle key={opt.key} pressed={value.shape === opt.key} onClick={() => onChange({ shape: opt.key })}>
              {opt.label}
            </Toggle>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-5">
        <Field label="Width (m)" htmlFor={ids.width} error={errors.widthM}>
          <input
            id={ids.width}
            type="number"
            min={0}
            step={0.1}
            value={value.widthM ?? ""}
            onChange={(e) => onChange({ widthM: e.target.value === "" ? null : Number(e.target.value) })}
            className={inputClass(Boolean(errors.widthM))}
          />
        </Field>
        <Field label="Length (m)" htmlFor={ids.length} error={errors.lengthM}>
          <input
            id={ids.length}
            type="number"
            min={0}
            step={0.1}
            value={value.lengthM ?? ""}
            onChange={(e) => onChange({ lengthM: e.target.value === "" ? null : Number(e.target.value) })}
            className={inputClass(Boolean(errors.lengthM))}
          />
        </Field>
        <Field label="Total area (sqm)" htmlFor={ids.area} error={errors.areaSqm} helper="Leave blank to estimate from width × length.">
          <input
            id={ids.area}
            type="number"
            min={0}
            value={value.areaSqm ?? ""}
            onChange={(e) => onChange({ areaSqm: e.target.value === "" ? null : Number(e.target.value) })}
            className={inputClass(Boolean(errors.areaSqm))}
          />
        </Field>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <Field label="Plot orientation" htmlFor={ids.orientation} helper="e.g. north-facing frontage.">
          <input id={ids.orientation} type="text" value={value.orientation} onChange={(e) => onChange({ orientation: e.target.value })} className={inputClass()} />
        </Field>
        <div>
          <p className="text-sm font-bold text-slate-700 mb-2">Slope</p>
          <div className="flex flex-wrap gap-2">
            {SLOPE_OPTIONS.map((opt) => (
              <Toggle key={opt.key} pressed={value.slope === opt.key} onClick={() => onChange({ slope: opt.key })}>
                {opt.label}
              </Toggle>
            ))}
          </div>
        </div>
      </div>

      <Field label="Road access" htmlFor={ids.road}>
        <input id={ids.road} type="text" value={value.accessRoad} onChange={(e) => onChange({ accessRoad: e.target.value })} className={inputClass()} placeholder="e.g. Paved access road" />
      </Field>

      <Field label="Existing structures" htmlFor={ids.existing}>
        <input id={ids.existing} type="text" value={value.existingStructures} onChange={(e) => onChange({ existingStructures: e.target.value })} className={inputClass()} placeholder="e.g. None — vacant plot" />
      </Field>

      <div>
        <p className="text-sm font-bold text-slate-700 mb-2">Known utility access</p>
        <div className="flex flex-wrap gap-2">
          {UTILITY_OPTIONS.map((utility) => (
            <Toggle key={utility} pressed={value.utilityAccess.includes(utility)} onClick={() => toggleUtility(utility)}>
              {utility}
            </Toggle>
          ))}
        </div>
      </div>

      <Field label="Notes about surroundings" htmlFor={ids.notes}>
        <textarea id={ids.notes} rows={3} value={value.notes} onChange={(e) => onChange({ notes: e.target.value })} className={`${inputClass()} resize-none`} />
      </Field>

      <div>
        <p className="text-sm font-bold text-slate-700 mb-2">Plot documents</p>
        <p className="text-xs text-slate-400 mb-2">Upload a survey, plot plan or sketch if you have one. Everything here can be skipped and added later.</p>
        <FileUploadList files={value.files} onChange={(files) => onChange({ files })} category="plot_document" />
      </div>
    </div>
  );
}
