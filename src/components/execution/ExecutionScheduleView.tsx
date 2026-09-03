"use client";

import React, { useState } from "react";
import { ExecutionProject, ExecutionTask, TASK_STATUS_LABELS, TaskStatus, ExecutionRole } from "../../lib/execution/types";
import { ExecutionScheduleService } from "../../lib/execution/executionService";
import { AddTaskModal } from "./ExecutionModals";
import { canPerformExecutionAction } from "../../lib/execution/permissions";

interface ScheduleViewProps {
  project: ExecutionProject;
  currentRole: ExecutionRole;
}

export function ExecutionScheduleView({ project, currentRole }: ScheduleViewProps) {
  const [viewMode, setViewMode] = useState<"list" | "calendar" | "timeline" | "mobile">("list");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<ExecutionTask | null>(null);
  const [progressInput, setProgressInput] = useState(0);
  const [delayReason, setDelayReason] = useState("");

  const canEdit = canPerformExecutionAction(currentRole, "schedule.edit");

  const handleAddTask = (data: any) => {
    ExecutionScheduleService.addTask(
      project.id,
      {
        ...data,
        workPackageId: "wp-1",
        progressPercent: 0,
        status: "not_started",
        dependencies: [],
      },
      currentRole === "customer" ? project.customerName : project.contractorName,
      currentRole
    );
  };

  const handleUpdateTaskProgress = (task: ExecutionTask, newProgress: number, status: TaskStatus) => {
    ExecutionScheduleService.updateTask(
      project.id,
      task.id,
      { progressPercent: newProgress, status },
      currentRole === "customer" ? project.customerName : project.contractorName,
      currentRole,
      delayReason
    );
    setEditingTask(null);
    setDelayReason("");
  };

  const getStatusBadgeClass = (status: TaskStatus) => {
    switch (status) {
      case "completed":
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
      case "in_progress":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "blocked":
      case "delayed":
        return "bg-red-100 text-red-800 border-red-300";
      case "awaiting_inspection":
        return "bg-amber-100 text-amber-800 border-amber-300";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Construction Schedule & Work Packages</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {project.tasks.length} total tasks across {project.workPackages.length} active work packages.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Toggles */}
          <div className="bg-slate-100 p-1 rounded-2xl border flex items-center gap-1 text-xs font-semibold">
            {(["list", "calendar", "timeline", "mobile"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setViewMode(v)}
                className={`px-3 py-1.5 rounded-xl capitalize transition-colors ${
                  viewMode === v ? "bg-white text-slate-900 shadow-sm font-bold" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {v}
              </button>
            ))}
          </div>

          {canEdit && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
            >
              + Add Task
            </button>
          )}
        </div>
      </div>

      {/* List View */}
      {viewMode === "list" && (
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] border-b">
                <tr>
                  <th className="p-4">Phase & Task Title</th>
                  <th className="p-4">Assignee</th>
                  <th className="p-4">Dates</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Progress</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {project.tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-slate-50/80">
                    <td className="p-4">
                      <div className="text-[10px] uppercase font-bold text-slate-400">{task.phase}</div>
                      <div className="font-bold text-slate-900 text-sm">{task.title}</div>
                      <div className="text-slate-500 text-[11px] line-clamp-1">{task.description}</div>
                    </td>
                    <td className="p-4 font-medium text-slate-700">{task.assigneeName}</td>
                    <td className="p-4 font-mono text-slate-600">
                      <div>{task.plannedStart}</div>
                      <div className="text-[10px] text-slate-400">to {task.plannedFinish}</div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 text-[11px] font-bold rounded-full border ${getStatusBadgeClass(task.status)}`}>
                        {TASK_STATUS_LABELS[task.status]}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div className="bg-[#2ec440] h-1.5 rounded-full" style={{ width: `${task.progressPercent}%` }} />
                        </div>
                        <span className="font-bold text-slate-700">{task.progressPercent}%</span>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      {canEdit ? (
                        <button
                          onClick={() => {
                            setEditingTask(task);
                            setProgressInput(task.progressPercent);
                          }}
                          className="px-3 py-1.5 border rounded-xl text-xs font-semibold hover:bg-slate-100"
                        >
                          Update
                        </button>
                      ) : (
                        <span className="text-slate-400 font-medium">Read only</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Calendar View Placeholder */}
      {viewMode === "calendar" && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-slate-900">Monthly Construction Calendar View</h3>
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-400 border-b pb-2">
            <span>MON</span><span>TUE</span><span>WED</span><span>THU</span><span>FRI</span><span>SAT</span><span>SUN</span>
          </div>
          <div className="grid grid-cols-7 gap-2 text-xs">
            {Array.from({ length: 28 }).map((_, i) => (
              <div key={i} className="min-h-[70px] p-2 bg-slate-50 border rounded-2xl text-slate-400">
                <span className="font-bold text-slate-700">{i + 1}</span>
                {i === 12 && (
                  <div className="mt-1 bg-emerald-100 text-emerald-800 text-[10px] p-1 rounded font-semibold truncate">
                    Structural Concrete
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Gantt Timeline View */}
      {viewMode === "timeline" && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-slate-900">Gantt-Style Timeline View</h3>
          <div className="space-y-3">
            {project.tasks.map((task) => (
              <div key={task.id} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <span>{task.title}</span>
                  <span className="text-slate-500">{task.plannedStart} to {task.plannedFinish} ({task.progressPercent}%)</span>
                </div>
                <div className="w-full bg-slate-100 h-4 rounded-xl overflow-hidden relative">
                  <div
                    className="bg-[#2ec440] h-full rounded-xl transition-all"
                    style={{ width: `${task.progressPercent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mobile Task Card View */}
      {viewMode === "mobile" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {project.tasks.map((task) => (
            <div key={task.id} className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold uppercase text-slate-400">{task.phase}</span>
                <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${getStatusBadgeClass(task.status)}`}>
                  {TASK_STATUS_LABELS[task.status]}
                </span>
              </div>
              <h4 className="font-bold text-slate-900 text-sm">{task.title}</h4>
              <p className="text-xs text-slate-600">{task.description}</p>
              <div className="flex items-center justify-between text-xs pt-2 border-t text-slate-500">
                <span>Assignee: <strong>{task.assigneeName}</strong></span>
                <span className="font-bold text-[#2ec440]">{task.progressPercent}%</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Task Drawer / Modal */}
      {editingTask && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Update Progress: {editingTask.title}</h3>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Progress Percentage ({progressInput}%)</label>
              <input
                type="range"
                min={0}
                max={100}
                value={progressInput}
                onChange={(e) => setProgressInput(Number(e.target.value))}
                className="w-full accent-[#2ec440]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Status</label>
              <select
                defaultValue={editingTask.status}
                id="update-status-select"
                className="w-full px-3 py-2 border rounded-xl text-sm"
              >
                <option value="not_started">Not Started</option>
                <option value="in_progress">In Progress</option>
                <option value="blocked">Blocked</option>
                <option value="delayed">Delayed</option>
                <option value="awaiting_inspection">Awaiting Inspection</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Delay / Blocker Reason (Required if Delayed)</label>
              <input
                type="text"
                value={delayReason}
                onChange={(e) => setDelayReason(e.target.value)}
                placeholder="Reason for schedule change..."
                className="w-full px-3 py-2 border rounded-xl text-sm"
              />
            </div>
            <div className="flex justify-end gap-3 pt-3 border-t">
              <button onClick={() => setEditingTask(null)} className="px-4 py-2 border rounded-xl text-sm font-semibold">Cancel</button>
              <button
                onClick={() => {
                  const sel = document.getElementById("update-status-select") as HTMLSelectElement;
                  handleUpdateTaskProgress(editingTask, progressInput, (sel?.value as TaskStatus) || editingTask.status);
                }}
                className="px-5 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold"
              >
                Save Progress
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      <AddTaskModal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddTask}
      />
    </div>
  );
}
