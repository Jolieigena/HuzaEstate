"use client";

import { ReactNode, useState } from "react";
import ConfirmModal from "@/components/shared/ConfirmModal";
import { useAuth } from "@/lib/auth-context";
import { useAdminState, useHasPermission } from "@/lib/admin/hooks";
import { AdminService } from "@/lib/admin/service";
import { useToast } from "@/lib/toast-context";
import { Card, PageFrame, PrimaryButton, RequirePermission, fieldClass } from "../ui";

function useActor() {
  const { account } = useAuth();
  return { actorAccountId: account?.id ?? "system", actorName: account?.name ?? "System" };
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-sm font-bold text-slate-700">
      {label}
      <div className="mt-2">{children}</div>
    </label>
  );
}

const FEATURE_FLAG_LABELS: Record<string, string> = {
  build: "Build module", renovate: "Renovate module", professional_applications: "Professional applications",
  professional_reviews: "Professional reviews", quotations: "Contractor quotations", ai_agent: "AI agent",
  ai_image_generation: "AI image generation", targeted_image_editing: "Targeted image editing",
  public_demo_videos: "Public demo videos", new_registrations: "New registrations",
};

export function SettingsPage() {
  const { account } = useAuth();
  const { actorAccountId, actorName } = useActor();
  const state = useAdminState();
  const { showToast } = useToast();
  const canManage = useHasPermission(account?.id, "settings.manage");
  const canManageFlags = useHasPermission(account?.id, "feature_flags.manage");

  const [general, setGeneral] = useState(state.settings.general);
  const [listings, setListings] = useState(state.settings.listings);
  const [build, setBuild] = useState(state.settings.build);
  const [renovate, setRenovate] = useState(state.settings.renovate);
  const [professionals, setProfessionals] = useState(state.settings.professionals);
  const [quotations, setQuotations] = useState(state.settings.quotations);
  const [files, setFiles] = useState(state.settings.files);
  const [notifications, setNotifications] = useState(state.settings.notifications);
  const [demoMode, setDemoMode] = useState(state.settings.demoMode);
  const [pendingFlag, setPendingFlag] = useState<string | null>(null);

  const save = <K extends keyof typeof state.settings>(section: K, value: (typeof state.settings)[K], label: string) => {
    AdminService.updateSettingsSection(section, value, actorAccountId, actorName, `Previous ${label}`, `Updated ${label}`);
    showToast(`${label} saved. Takes effect immediately for new activity.`);
  };

  return (
    <PageFrame title="Settings" description="Platform-wide configuration. High-impact changes (feature flags) require confirmation and are always recorded in the audit log.">
      <RequirePermission granted={canManage}>
        <div className="grid gap-6 xl:grid-cols-2">
          <Card>
            <h3 className="text-lg font-black text-slate-900">General</h3>
            <div className="mt-4 grid gap-4">
              <Field label="Platform name"><input className={fieldClass} value={general.platformName} onChange={(e) => setGeneral({ ...general, platformName: e.target.value })} /></Field>
              <Field label="Support contact"><input className={fieldClass} value={general.supportContact} onChange={(e) => setGeneral({ ...general, supportContact: e.target.value })} /></Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Default country"><input className={fieldClass} value={general.defaultCountry} onChange={(e) => setGeneral({ ...general, defaultCountry: e.target.value })} /></Field>
                <Field label="Default currency"><input className={fieldClass} value={general.defaultCurrency} onChange={(e) => setGeneral({ ...general, defaultCurrency: e.target.value })} /></Field>
              </div>
              <Field label="Maintenance notice (shown platform-wide when set)"><textarea className={`${fieldClass} min-h-16`} value={general.maintenanceNotice} onChange={(e) => setGeneral({ ...general, maintenanceNotice: e.target.value })} /></Field>
              <PrimaryButton onClick={() => save("general", general, "General settings")}>Save</PrimaryButton>
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-black text-slate-900">Listings</h3>
            <div className="mt-4 grid gap-4">
              <Field label="Allowed property types (comma-separated)"><input className={fieldClass} value={listings.allowedPropertyTypes.join(", ")} onChange={(e) => setListings({ ...listings, allowedPropertyTypes: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} /></Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Image limit"><input type="number" className={fieldClass} value={listings.imageLimit} onChange={(e) => setListings({ ...listings, imageLimit: Number(e.target.value) })} /></Field>
                <Field label="Report threshold"><input type="number" className={fieldClass} value={listings.reportThreshold} onChange={(e) => setListings({ ...listings, reportThreshold: Number(e.target.value) })} /></Field>
              </div>
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                <input type="checkbox" className="h-4 w-4 accent-[#2ec440]" checked={listings.reviewRequired} onChange={(e) => setListings({ ...listings, reviewRequired: e.target.checked })} />
                Listing review required before publishing
              </label>
              <PrimaryButton onClick={() => save("listings", listings, "Listing settings")}>Save</PrimaryButton>
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-black text-slate-900">Build</h3>
            <div className="mt-4 grid gap-4">
              <Field label="Available design styles (comma-separated)"><input className={fieldClass} value={build.availableStyles.join(", ")} onChange={(e) => setBuild({ ...build, availableStyles: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} /></Field>
              <Field label="Generation limit per project"><input type="number" className={fieldClass} value={build.generationLimit} onChange={(e) => setBuild({ ...build, generationLimit: Number(e.target.value) })} /></Field>
              <Field label="Concept disclaimer"><textarea className={`${fieldClass} min-h-16`} value={build.conceptDisclaimer} onChange={(e) => setBuild({ ...build, conceptDisclaimer: e.target.value })} /></Field>
              <PrimaryButton onClick={() => save("build", build, "Build settings")}>Save</PrimaryButton>
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-black text-slate-900">Renovate</h3>
            <div className="mt-4 grid gap-4">
              <Field label="Renovation categories (comma-separated)"><input className={fieldClass} value={renovate.categories.join(", ")} onChange={(e) => setRenovate({ ...renovate, categories: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} /></Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Upload limit"><input type="number" className={fieldClass} value={renovate.uploadLimit} onChange={(e) => setRenovate({ ...renovate, uploadLimit: Number(e.target.value) })} /></Field>
                <Field label="Generation limit"><input type="number" className={fieldClass} value={renovate.generationLimit} onChange={(e) => setRenovate({ ...renovate, generationLimit: Number(e.target.value) })} /></Field>
              </div>
              <Field label="Safety disclaimer"><textarea className={`${fieldClass} min-h-16`} value={renovate.safetyDisclaimer} onChange={(e) => setRenovate({ ...renovate, safetyDisclaimer: e.target.value })} /></Field>
              <PrimaryButton onClick={() => save("renovate", renovate, "Renovate settings")}>Save</PrimaryButton>
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-black text-slate-900">Professionals</h3>
            <div className="mt-4 grid gap-4">
              <Field label="Required documents (comma-separated)"><input className={fieldClass} value={professionals.requiredDocuments.join(", ")} onChange={(e) => setProfessionals({ ...professionals, requiredDocuments: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} /></Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Credential expiry warning (days)"><input type="number" className={fieldClass} value={professionals.credentialExpiryWarningDays} onChange={(e) => setProfessionals({ ...professionals, credentialExpiryWarningDays: Number(e.target.value) })} /></Field>
                <Field label="Maximum active requests"><input type="number" className={fieldClass} value={professionals.maximumActiveRequests} onChange={(e) => setProfessionals({ ...professionals, maximumActiveRequests: Number(e.target.value) })} /></Field>
              </div>
              <PrimaryButton onClick={() => save("professionals", professionals, "Professional settings")}>Save</PrimaryButton>
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-black text-slate-900">Quotations</h3>
            <div className="mt-4 grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Default validity (days)"><input type="number" className={fieldClass} value={quotations.defaultValidityDays} onChange={(e) => setQuotations({ ...quotations, defaultValidityDays: Number(e.target.value) })} /></Field>
                <Field label="Allowed currencies (comma-separated)"><input className={fieldClass} value={quotations.allowedCurrencies.join(", ")} onChange={(e) => setQuotations({ ...quotations, allowedCurrencies: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} /></Field>
              </div>
              <PrimaryButton onClick={() => save("quotations", quotations, "Quotation settings")}>Save</PrimaryButton>
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-black text-slate-900">Files</h3>
            <div className="mt-4 grid gap-4">
              <Field label="Supported file types (comma-separated)"><input className={fieldClass} value={files.supportedTypes.join(", ")} onChange={(e) => setFiles({ ...files, supportedTypes: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} /></Field>
              <Field label="Maximum file size (MB)"><input type="number" className={fieldClass} value={files.maxFileSizeMb} onChange={(e) => setFiles({ ...files, maxFileSizeMb: Number(e.target.value) })} /></Field>
              <PrimaryButton onClick={() => save("files", files, "File settings")}>Save</PrimaryButton>
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-black text-slate-900">Notifications</h3>
            <div className="mt-4 grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Reminder timing (hours)"><input type="number" className={fieldClass} value={notifications.reminderTimingHours} onChange={(e) => setNotifications({ ...notifications, reminderTimingHours: Number(e.target.value) })} /></Field>
                <Field label="Escalation timing (hours)"><input type="number" className={fieldClass} value={notifications.escalationTimingHours} onChange={(e) => setNotifications({ ...notifications, escalationTimingHours: Number(e.target.value) })} /></Field>
              </div>
              <p className="text-xs text-slate-500">Email notifications are prototype preferences only — no email provider is connected.</p>
              <PrimaryButton onClick={() => save("notifications", notifications, "Notification settings")}>Save</PrimaryButton>
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-black text-slate-900">Privacy and retention</h3>
            <p className="mt-2 text-sm text-slate-600">{state.settings.privacy.retentionLabel}</p>
            <p className="mt-2 text-xs text-slate-500">Private-project access reasons: {state.settings.privacy.accessReasons.join(", ").replace(/_/g, " ")}</p>
            <p className="mt-2 text-xs text-slate-500">{state.settings.privacy.exportRule}</p>
          </Card>

          <Card>
            <h3 className="text-lg font-black text-slate-900">Demo mode</h3>
            <p className="mt-2 text-sm text-slate-600">Controls whether seeded synthetic directory rows appear in User Management. Real demo login accounts are unaffected.</p>
            <label className="mt-3 flex items-center gap-2 text-sm font-bold text-slate-700">
              <input
                type="checkbox"
                className="h-4 w-4 accent-[#2ec440]"
                checked={demoMode}
                onChange={(e) => {
                  setDemoMode(e.target.checked);
                  AdminService.updateSettingsSection("demoMode", e.target.checked, actorAccountId, actorName, String(!e.target.checked), String(e.target.checked));
                  showToast("Demo mode preference saved.");
                }}
              />
              Show seeded synthetic demo records
            </label>
          </Card>

          {canManageFlags && (
            <Card className="xl:col-span-2">
              <h3 className="text-lg font-black text-slate-900">Feature flags</h3>
              <p className="mt-1 text-sm text-slate-500">Disabling a feature is high-impact and requires confirmation.</p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {Object.entries(state.settings.featureFlags).map(([key, enabled]) => (
                  <div key={key} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3.5">
                    <span className="text-sm font-semibold text-slate-700">{FEATURE_FLAG_LABELS[key] ?? key}</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={enabled}
                      aria-label={FEATURE_FLAG_LABELS[key] ?? key}
                      onClick={() => {
                        if (enabled) setPendingFlag(key);
                        else {
                          AdminService.toggleFeatureFlag(key, true, actorAccountId, actorName);
                          showToast(`${FEATURE_FLAG_LABELS[key] ?? key} enabled.`);
                        }
                      }}
                      className={`relative h-6 w-11 flex-shrink-0 rounded-full transition-colors ${enabled ? "bg-[#2ec440]" : "bg-slate-200"}`}
                    >
                      <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform ${enabled ? "translate-x-6" : "translate-x-1"}`} />
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        <ConfirmModal
          open={Boolean(pendingFlag)}
          onClose={() => setPendingFlag(null)}
          destructive
          title={`Disable ${pendingFlag ? (FEATURE_FLAG_LABELS[pendingFlag] ?? pendingFlag) : ""}?`}
          description="This takes effect immediately across the platform and is recorded in the audit log."
          confirmLabel="Disable feature"
          onConfirm={() => {
            if (!pendingFlag) return;
            AdminService.toggleFeatureFlag(pendingFlag, false, actorAccountId, actorName);
            showToast(`${FEATURE_FLAG_LABELS[pendingFlag] ?? pendingFlag} disabled.`);
            setPendingFlag(null);
          }}
        />
      </RequirePermission>
    </PageFrame>
  );
}
