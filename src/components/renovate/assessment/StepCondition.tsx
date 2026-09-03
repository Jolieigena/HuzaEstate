"use client";

import { CONDITION_RATING_LABELS, ConditionRating, ExistingConditionEntry, ProjectUploads, RENOVATION_AREA_LABELS, SelectedRenovationArea, UploadedFile } from "@/lib/renovate/types";
import { FormField, inputClass } from "./FormField";
import FileUploadList from "@/components/renovate/FileUploadList";

interface Props {
  areas: SelectedRenovationArea[];
  conditions: ExistingConditionEntry[];
  onChangeConditions: (conditions: ExistingConditionEntry[]) => void;
  uploads: ProjectUploads;
  onChangeUploads: (patch: Partial<ProjectUploads>) => void;
}

function emptyCondition(areaId: string): ExistingConditionEntry {
  return {
    areaId,
    conditionRating: "unknown",
    wallFinish: "",
    floorMaterial: "",
    ceiling: "",
    windows: "",
    doors: "",
    lighting: "",
    storage: "",
    plumbingCondition: "",
    electricalCondition: "",
    moistureOrWaterDamage: "",
    visibleCracks: "",
    ventilation: "",
    naturalLight: "",
    accessibility: "",
    otherConcerns: "",
  };
}

const TEXT_FIELDS: { key: keyof ExistingConditionEntry; label: string }[] = [
  { key: "wallFinish", label: "Existing wall finish" },
  { key: "floorMaterial", label: "Existing floor material" },
  { key: "ceiling", label: "Existing ceiling" },
  { key: "windows", label: "Existing windows" },
  { key: "doors", label: "Existing doors" },
  { key: "lighting", label: "Existing lighting" },
  { key: "storage", label: "Existing storage" },
  { key: "plumbingCondition", label: "Plumbing condition" },
  { key: "electricalCondition", label: "Electrical condition" },
  { key: "moistureOrWaterDamage", label: "Moisture or water damage" },
  { key: "visibleCracks", label: "Visible cracks" },
  { key: "ventilation", label: "Ventilation" },
  { key: "naturalLight", label: "Natural light" },
  { key: "accessibility", label: "Accessibility" },
  { key: "otherConcerns", label: "Other concerns" },
];

export default function StepCondition({ areas, conditions, onChangeConditions, uploads, onChangeUploads }: Props) {
  const areaOptions = areas.map((a) => ({ id: a.id, label: a.customLabel || RENOVATION_AREA_LABELS[a.areaKey] }));

  const getCondition = (areaId: string): ExistingConditionEntry => conditions.find((c) => c.areaId === areaId) ?? emptyCondition(areaId);

  const updateCondition = (areaId: string, patch: Partial<ExistingConditionEntry>) => {
    const existing = conditions.find((c) => c.areaId === areaId);
    if (existing) {
      onChangeConditions(conditions.map((c) => (c.areaId === areaId ? { ...c, ...patch } : c)));
    } else {
      onChangeConditions([...conditions, { ...emptyCondition(areaId), ...patch }]);
    }
  };

  const setUploadCategory = (category: keyof ProjectUploads) => (files: UploadedFile[]) => onChangeUploads({ [category]: files } as Partial<ProjectUploads>);

  if (areas.length === 0) {
    return <p className="text-slate-500 text-sm">Select renovation areas in the previous step first.</p>;
  }

  return (
    <div className="space-y-6">
      <p className="text-slate-500 text-sm">Record the existing condition of each area. This helps Huza AI and any professional reviewer understand what they&apos;re working with.</p>

      {areas.map((area) => {
        const condition = getCondition(area.id);
        return (
          <div key={area.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
            <h3 className="font-bold text-slate-900 mb-4">{area.customLabel || RENOVATION_AREA_LABELS[area.areaKey]}</h3>

            <FormField label="Overall condition rating">
              {(id) => (
                <select
                  id={id}
                  value={condition.conditionRating}
                  onChange={(e) => updateCondition(area.id, { conditionRating: e.target.value as ConditionRating })}
                  className={`${inputClass} max-w-xs`}
                >
                  {Object.entries(CONDITION_RATING_LABELS).map(([k, l]) => (
                    <option key={k} value={k}>
                      {l}
                    </option>
                  ))}
                </select>
              )}
            </FormField>

            <div className="grid sm:grid-cols-3 gap-3 mt-4">
              {TEXT_FIELDS.map((f) => (
                <FormField key={f.key} label={f.label} optional>
                  {(id) => (
                    <input
                      id={id}
                      value={String(condition[f.key] ?? "")}
                      onChange={(e) => updateCondition(area.id, { [f.key]: e.target.value } as Partial<ExistingConditionEntry>)}
                      className={inputClass}
                    />
                  )}
                </FormField>
              ))}
            </div>
          </div>
        );
      })}

      <div className="space-y-5">
        <div>
          <h3 className="font-bold text-slate-900 mb-2">Room and exterior photographs</h3>
          <FileUploadList files={uploads.photos} onChange={setUploadCategory("photos")} category="room_photo" areaOptions={areaOptions} />
        </div>
        <div>
          <h3 className="font-bold text-slate-900 mb-2">Walkthrough videos</h3>
          <FileUploadList files={uploads.videos} onChange={setUploadCategory("videos")} category="walkthrough_video" areaOptions={areaOptions} helperText="MP4 or MOV — up to 50MB each." />
        </div>
        <div>
          <h3 className="font-bold text-slate-900 mb-2">Floor plans, sketches, inspection reports or measurements</h3>
          <FileUploadList files={uploads.floorPlans} onChange={setUploadCategory("floorPlans")} category="floor_plan" areaOptions={areaOptions} helperText="PDF, JPG, PNG or WEBP." />
        </div>
      </div>
    </div>
  );
}
