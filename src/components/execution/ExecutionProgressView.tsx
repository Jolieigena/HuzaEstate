"use client";

import React from "react";
import Image from "next/image";
import { ExecutionProject, ExecutionRole } from "../../lib/execution/types";

interface ProgressViewProps {
  project: ExecutionProject;
  currentRole: ExecutionRole;
}

export function ExecutionProgressView({ project }: ProgressViewProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Progress Reports & Media Gallery</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Planned vs actual delivery tracking, weekly reports, delay forecasts, and visual observation evidence.
          </p>
        </div>
      </div>

      {/* Progress Reports List */}
      <div className="space-y-4">
        {project.progressReports.map((report) => (
          <div key={report.id} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900 uppercase font-mono">{report.reportType.replace("_", " ")}</span>
                  {report.isAiObservation && (
                    <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                      Automated visual observation—not professional verification
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Reporting Period: <strong>{report.periodStart} to {report.periodEnd}</strong> • Submitted by {report.submittedBy}
                </div>
              </div>

              <div className="flex items-center gap-3 bg-slate-50 border rounded-2xl p-3 text-xs">
                <div>Planned: <strong>{report.plannedProgressPercent}%</strong></div>
                <span>•</span>
                <div>Actual: <strong className="text-[#2ec440]">{report.actualProgressPercent}%</strong></div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-2xl border">
                <span className="font-bold text-slate-800 block mb-1">Completed Work:</span>
                <p className="text-slate-600">{report.completedWorkSummary}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-2xl border">
                <span className="font-bold text-slate-800 block mb-1">Current Work:</span>
                <p className="text-slate-600">{report.currentWorkSummary}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-2xl border">
                <span className="font-bold text-slate-800 block mb-1">Forecast & Decisions:</span>
                <p className="text-slate-600">{report.updatedCompletionForecast}</p>
              </div>
            </div>

            {report.evidencePhotoUrls.length > 0 && (
              <div>
                <span className="text-xs font-bold text-slate-700 block mb-2">Report Photo Gallery:</span>
                <div className="flex gap-3 overflow-x-auto">
                  {report.evidencePhotoUrls.map((url, idx) => (
                    <div key={idx} className="relative w-40 h-28 rounded-2xl overflow-hidden border bg-slate-100">
                      <Image src={url} alt="Report evidence" fill className="object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
