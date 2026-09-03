"use client";

import React, { useState } from "react";
import Dialog from "../Dialog";
import { ExecutionRole, TaskPriority, PhaseName, MaterialStatus, InspectionType, IssuePriority, DefectSeverity } from "../../lib/execution/types";

interface ModalBaseProps {
  open: boolean;
  onClose: () => void;
}

export function AddTaskModal({ open, onClose, onSubmit }: ModalBaseProps & { onSubmit: (data: { title: string; description: string; phase: PhaseName; plannedStart: string; plannedFinish: string; assigneeName: string; assigneeRole: ExecutionRole; priority: TaskPriority }) => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [phase, setPhase] = useState<PhaseName>("Foundation and substructure");
  const [plannedStart, setPlannedStart] = useState("");
  const [plannedFinish, setPlannedFinish] = useState("");
  const [assigneeName, setAssigneeName] = useState("Imara Construction Ltd");
  const [assigneeRole, setAssigneeRole] = useState<ExecutionRole>("contractor");
  const [priority, setPriority] = useState<TaskPriority>("normal");

  if (!open) return null;

  return (
    <Dialog open={open} onClose={onClose} labelledBy="add-task-title">
      <form onSubmit={(e) => { e.preventDefault(); onSubmit({ title, description, phase, plannedStart, plannedFinish, assigneeName, assigneeRole, priority }); onClose(); }} className="p-6 space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <h3 id="add-task-title" className="text-lg font-bold text-slate-900">Add Construction Task</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold" data-dialog-close>✕</button>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Task Title</label>
          <input required type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Masonry Brick Wall Casting" className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-[#2ec440] outline-none text-sm" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Phase</label>
          <select value={phase} onChange={(e) => setPhase(e.target.value as PhaseName)} className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-[#2ec440]">
            <option value="Foundation and substructure">Foundation and substructure</option>
            <option value="Structural work">Structural work</option>
            <option value="Roofing">Roofing</option>
            <option value="Plumbing and electrical">Plumbing and electrical</option>
            <option value="Walls and ceilings">Walls and ceilings</option>
            <option value="Finishes">Finishes</option>
            <option value="Fixtures and cabinetry">Fixtures and cabinetry</option>
            <option value="Testing and inspection">Testing and inspection</option>
            <option value="Snagging">Snagging</option>
            <option value="Handover">Handover</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Planned Start</label>
            <input required type="date" value={plannedStart} onChange={(e) => setPlannedStart(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Planned Finish</label>
            <input required type="date" value={plannedFinish} onChange={(e) => setPlannedFinish(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-sm" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Assignee</label>
            <input type="text" value={assigneeName} onChange={(e) => setAssigneeName(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Priority</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)} className="w-full px-3 py-2 border rounded-xl text-sm">
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Task Scope & Description</label>
          <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Provide task requirements..." className="w-full px-3 py-2 border rounded-xl text-sm" />
        </div>
        <div className="flex justify-end gap-3 pt-3 border-t">
          <button type="button" onClick={onClose} className="px-4 py-2 border rounded-xl text-sm font-semibold hover:bg-slate-50">Cancel</button>
          <button type="submit" className="px-5 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800">Add Task</button>
        </div>
      </form>
    </Dialog>
  );
}

export function AddSiteDiaryModal({ open, onClose, onSubmit }: ModalBaseProps & { onSubmit: (data: { date: string; workCompleted: string; workInProgress: string; labourCount: number; weatherSummary: string; notes: string; photoUrls: string[] }) => void }) {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [workCompleted, setWorkCompleted] = useState("");
  const [workInProgress, setWorkInProgress] = useState("");
  const [labourCount, setLabourCount] = useState(12);
  const [weatherSummary, setWeatherSummary] = useState("Sunny, 26°C");
  const [notes, setNotes] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");

  if (!open) return null;

  return (
    <Dialog open={open} onClose={onClose} labelledBy="add-diary-title">
      <form onSubmit={(e) => { e.preventDefault(); onSubmit({ date, workCompleted, workInProgress, labourCount, weatherSummary, notes, photoUrls: photoUrl ? [photoUrl] : [] }); onClose(); }} className="p-6 space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <h3 id="add-diary-title" className="text-lg font-bold text-slate-900">Log Daily Site Diary Entry</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold" data-dialog-close>✕</button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Date</label>
            <input required type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Labour On-Site (Count)</label>
            <input required type="number" min={1} value={labourCount} onChange={(e) => setLabourCount(Number(e.target.value))} className="w-full px-3 py-2 border rounded-xl text-sm" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Work Completed Today</label>
          <textarea required rows={3} value={workCompleted} onChange={(e) => setWorkCompleted(e.target.value)} placeholder="Describe work completed on site..." className="w-full px-3 py-2 border rounded-xl text-sm" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Work in Progress</label>
          <input type="text" value={workInProgress} onChange={(e) => setWorkInProgress(e.target.value)} placeholder="Ongoing activities..." className="w-full px-3 py-2 border rounded-xl text-sm" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Weather & Site Conditions (Manual)</label>
          <input type="text" value={weatherSummary} onChange={(e) => setWeatherSummary(e.target.value)} placeholder="e.g. Heavy rain morning, dry afternoon" className="w-full px-3 py-2 border rounded-xl text-sm" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Site Evidence Photo URL (Optional)</label>
          <input type="url" value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} placeholder="https://..." className="w-full px-3 py-2 border rounded-xl text-sm" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Notes & Safety Observations</label>
          <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Safety gear checks, visitors..." className="w-full px-3 py-2 border rounded-xl text-sm" />
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
          <strong>Note:</strong> Once submitted, site diary entries are locked to preserve audit integrity. Amendments require an explicit reason.
        </div>
        <div className="flex justify-end gap-3 pt-3 border-t">
          <button type="button" onClick={onClose} className="px-4 py-2 border rounded-xl text-sm font-semibold hover:bg-slate-50">Cancel</button>
          <button type="submit" className="px-5 py-2 bg-[#2ec440] text-white rounded-xl text-sm font-bold hover:opacity-90">Submit Entry & Lock</button>
        </div>
      </form>
    </Dialog>
  );
}

export function RequestInspectionModal({ open, onClose, onSubmit }: ModalBaseProps & { onSubmit: (data: { type: InspectionType; title: string; scheduledDate: string; locationOnSite: string; assignedInspectorName: string }) => void }) {
  const [type, setType] = useState<InspectionType>("foundation");
  const [title, setTitle] = useState("Foundation & Substructure Inspection");
  const [scheduledDate, setScheduledDate] = useState("");
  const [locationOnSite, setLocationOnSite] = useState("Main Building Slab Footings");
  const [assignedInspectorName, setAssignedInspectorName] = useState("Eric Habimana");

  if (!open) return null;

  return (
    <Dialog open={open} onClose={onClose} labelledBy="req-insp-title">
      <form onSubmit={(e) => { e.preventDefault(); onSubmit({ type, title, scheduledDate, locationOnSite, assignedInspectorName }); onClose(); }} className="p-6 space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <h3 id="req-insp-title" className="text-lg font-bold text-slate-900">Request Technical Stage Inspection</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold" data-dialog-close>✕</button>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Inspection Type</label>
          <select value={type} onChange={(e) => setType(e.target.value as InspectionType)} className="w-full px-3 py-2 border rounded-xl text-sm">
            <option value="site_readiness">Site Readiness</option>
            <option value="foundation">Foundation & Substructure</option>
            <option value="structural_frame">Structural Frame</option>
            <option value="roofing">Roofing & Water Tightness</option>
            <option value="electrical_rough_in">Electrical Rough-in</option>
            <option value="plumbing_rough_in">Plumbing Rough-in</option>
            <option value="waterproofing">Waterproofing Barrier</option>
            <option value="finishes">Finishes & Joinery</option>
            <option value="final_inspection">Final Handover Inspection</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Inspection Title</label>
          <input required type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-sm" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Scheduled Date</label>
            <input required type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Assigned Inspector / Engineer</label>
            <input required type="text" value={assignedInspectorName} onChange={(e) => setAssignedInspectorName(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-sm" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Location on Site</label>
          <input required type="text" value={locationOnSite} onChange={(e) => setLocationOnSite(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-sm" />
        </div>
        <div className="flex justify-end gap-3 pt-3 border-t">
          <button type="button" onClick={onClose} className="px-4 py-2 border rounded-xl text-sm font-semibold hover:bg-slate-50">Cancel</button>
          <button type="submit" className="px-5 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800">Request Inspection</button>
        </div>
      </form>
    </Dialog>
  );
}

export function AddChangeRequestModal({ open, onClose, onSubmit }: ModalBaseProps & { onSubmit: (data: { title: string; description: string; reason: string; costImpact: number; scheduleImpactDays: number; scopeImpactSummary: string }) => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [reason, setReason] = useState("");
  const [costImpact, setCostImpact] = useState(0);
  const [scheduleImpactDays, setScheduleImpactDays] = useState(0);
  const [scopeImpactSummary, setScopeImpactSummary] = useState("");

  if (!open) return null;

  return (
    <Dialog open={open} onClose={onClose} labelledBy="add-cr-title">
      <form onSubmit={(e) => { e.preventDefault(); onSubmit({ title, description, reason, costImpact, scheduleImpactDays, scopeImpactSummary }); onClose(); }} className="p-6 space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <h3 id="add-cr-title" className="text-lg font-bold text-slate-900">Raise Change Request</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold" data-dialog-close>✕</button>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Change Title</label>
          <input required type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Upgrade living room flooring to hardwood" className="w-full px-3 py-2 border rounded-xl text-sm" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Detailed Description</label>
          <textarea required rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe proposed variation..." className="w-full px-3 py-2 border rounded-xl text-sm" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Reason / Justification</label>
          <input required type="text" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Customer design preference change" className="w-full px-3 py-2 border rounded-xl text-sm" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Estimated Cost Impact (RWF)</label>
            <input type="number" value={costImpact} onChange={(e) => setCostImpact(Number(e.target.value))} placeholder="+/- amount" className="w-full px-3 py-2 border rounded-xl text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Schedule Impact (Days)</label>
            <input type="number" value={scheduleImpactDays} onChange={(e) => setScheduleImpactDays(Number(e.target.value))} placeholder="Additional days" className="w-full px-3 py-2 border rounded-xl text-sm" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Scope Impact Summary</label>
          <input type="text" value={scopeImpactSummary} onChange={(e) => setScopeImpactSummary(e.target.value)} placeholder="Affected rooms or work packages..." className="w-full px-3 py-2 border rounded-xl text-sm" />
        </div>
        <div className="bg-slate-50 border rounded-xl p-3 text-xs text-slate-600">
          <strong>Note:</strong> Accepted quotation baseline will remain unchanged. If approved by customer, a separate formal <strong>Change Order</strong> record will be created.
        </div>
        <div className="flex justify-end gap-3 pt-3 border-t">
          <button type="button" onClick={onClose} className="px-4 py-2 border rounded-xl text-sm font-semibold hover:bg-slate-50">Cancel</button>
          <button type="submit" className="px-5 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800">Submit Change Request</button>
        </div>
      </form>
    </Dialog>
  );
}

export function AddIssueModal({ open, onClose, onSubmit }: ModalBaseProps & { onSubmit: (data: { title: string; description: string; priority: IssuePriority; assignedToName: string; roomLocation: string }) => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<IssuePriority>("normal");
  const [assignedToName, setAssignedToName] = useState("Imara Construction Ltd");
  const [roomLocation, setRoomLocation] = useState("");

  if (!open) return null;

  return (
    <Dialog open={open} onClose={onClose} labelledBy="add-iss-title">
      <form onSubmit={(e) => { e.preventDefault(); onSubmit({ title, description, priority, assignedToName, roomLocation }); onClose(); }} className="p-6 space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <h3 id="add-iss-title" className="text-lg font-bold text-slate-900">Report Issue / RFI</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold" data-dialog-close>✕</button>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Issue Title</label>
          <input required type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Unexplained water seepage near foundation" className="w-full px-3 py-2 border rounded-xl text-sm" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Priority</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value as IssuePriority)} className="w-full px-3 py-2 border rounded-xl text-sm font-semibold">
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
              <option value="stop_work">STOP WORK Alert ⚠️</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Assigned Party</label>
            <input required type="text" value={assignedToName} onChange={(e) => setAssignedToName(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-sm" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Room / Location on Site</label>
          <input type="text" value={roomLocation} onChange={(e) => setRoomLocation(e.target.value)} placeholder="e.g. Ground Floor East Wing" className="w-full px-3 py-2 border rounded-xl text-sm" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Description</label>
          <textarea required rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Provide full context..." className="w-full px-3 py-2 border rounded-xl text-sm" />
        </div>
        {priority === "stop_work" && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 font-medium">
            ⚠️ <strong>STOP WORK:</strong> Selecting Stop Work will trigger a prominent emergency banner across all project views and notify lead inspectors.
          </div>
        )}
        <div className="flex justify-end gap-3 pt-3 border-t">
          <button type="button" onClick={onClose} className="px-4 py-2 border rounded-xl text-sm font-semibold hover:bg-slate-50">Cancel</button>
          <button type="submit" className={`px-5 py-2 text-white rounded-xl text-sm font-bold ${priority === "stop_work" ? "bg-red-600 hover:bg-red-700" : "bg-slate-900 hover:bg-slate-800"}`}>
            Submit Issue
          </button>
        </div>
      </form>
    </Dialog>
  );
}

export function AddDefectModal({ open, onClose, onSubmit }: ModalBaseProps & { onSubmit: (data: { roomLocation: string; category: string; description: string; severity: DefectSeverity; targetCorrectionDate: string }) => void }) {
  const [roomLocation, setRoomLocation] = useState("");
  const [category, setCategory] = useState("Finishes & Paint");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<DefectSeverity>("minor_cosmetic");
  const [targetCorrectionDate, setTargetCorrectionDate] = useState("");

  if (!open) return null;

  return (
    <Dialog open={open} onClose={onClose} labelledBy="add-def-title">
      <form onSubmit={(e) => { e.preventDefault(); onSubmit({ roomLocation, category, description, severity, targetCorrectionDate }); onClose(); }} className="p-6 space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <h3 id="add-def-title" className="text-lg font-bold text-slate-900">Add Snagging Defect Item</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold" data-dialog-close>✕</button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Room / Location</label>
            <input required type="text" value={roomLocation} onChange={(e) => setRoomLocation(e.target.value)} placeholder="e.g. Master Bedroom" className="w-full px-3 py-2 border rounded-xl text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Category</label>
            <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Joinery, Electrical" className="w-full px-3 py-2 border rounded-xl text-sm" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Severity</label>
          <select value={severity} onChange={(e) => setSeverity(e.target.value as DefectSeverity)} className="w-full px-3 py-2 border rounded-xl text-sm">
            <option value="minor_cosmetic">Minor Cosmetic</option>
            <option value="moderate">Moderate</option>
            <option value="major_functional">Major Functional</option>
            <option value="critical_safety">Critical Safety</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Defect Description</label>
          <textarea required rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the defect..." className="w-full px-3 py-2 border rounded-xl text-sm" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Target Correction Date</label>
          <input required type="date" value={targetCorrectionDate} onChange={(e) => setTargetCorrectionDate(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-sm" />
        </div>
        <div className="flex justify-end gap-3 pt-3 border-t">
          <button type="button" onClick={onClose} className="px-4 py-2 border rounded-xl text-sm font-semibold hover:bg-slate-50">Cancel</button>
          <button type="submit" className="px-5 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800">Add Defect Item</button>
        </div>
      </form>
    </Dialog>
  );
}
