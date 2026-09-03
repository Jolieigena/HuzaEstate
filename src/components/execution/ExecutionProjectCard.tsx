"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ExecutionProject, EXECUTION_STATUS_LABELS } from "../../lib/execution/types";

interface ExecutionProjectCardProps {
  project: ExecutionProject;
  baseHref?: string; // default "/execution"
}

export function ExecutionProjectCard({ project, baseHref = "/execution" }: ExecutionProjectCardProps) {
  const getStatusStyle = () => {
    switch (project.status) {
      case "active":
      case "ready_to_start":
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
      case "at_risk":
      case "delayed":
        return "bg-amber-100 text-amber-800 border-amber-300";
      case "paused":
        return "bg-slate-100 text-slate-800 border-slate-300";
      case "substantial_completion":
      case "snagging":
      case "ready_for_handover":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "handed_over":
        return "bg-purple-100 text-purple-800 border-purple-300";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const projectUrl = `${baseHref}/${project.id}`;

  return (
    <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
      <div>
        {/* Card Header & Media Preview */}
        <div className="relative h-44 bg-slate-100 w-full">
          {project.latestProgressImageUrl ? (
            <Image
              src={project.latestProgressImageUrl}
              alt={project.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400 font-semibold text-sm">
              No Site Image Available
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-black/20" />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex gap-2">
            <span className="px-2.5 py-1 text-[11px] font-bold uppercase rounded-full bg-white/90 text-slate-900 backdrop-blur-md">
              {project.sourceType === "build" ? "Build Construction" : "Renovation"}
            </span>
          </div>

          <div className="absolute top-3 right-3">
            <span className={`px-2.5 py-1 text-[11px] font-bold rounded-full border backdrop-blur-md ${getStatusStyle()}`}>
              {EXECUTION_STATUS_LABELS[project.status]}
            </span>
          </div>

          <div className="absolute bottom-3 left-3 right-3 text-white">
            <h3 className="text-lg font-bold drop-shadow-sm leading-tight">{project.name}</h3>
            <p className="text-xs text-slate-200 flex items-center gap-2 mt-0.5">
              <span>📍 {project.location}</span>
            </p>
          </div>
        </div>

        {/* Card Content Details */}
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-slate-400 block uppercase font-bold text-[10px]">Contractor</span>
              <span className="font-bold text-slate-800 truncate block">{project.contractorName}</span>
            </div>
            <div>
              <span className="text-slate-400 block uppercase font-bold text-[10px]">Agreed Value</span>
              <span className="font-bold text-slate-900">{project.contractValue.toLocaleString()} {project.currency}</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div>
            <div className="flex justify-between items-center text-xs font-semibold text-slate-600 mb-1">
              <span>Overall Progress</span>
              <span className="text-[#2ec440] font-bold">{project.overallProgressPercent}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-[#2ec440] h-2 rounded-full transition-all duration-300"
                style={{ width: `${project.overallProgressPercent}%` }}
              />
            </div>
          </div>

          {/* Stage & Next Action */}
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 text-xs space-y-1.5">
            <div className="flex items-center justify-between text-slate-500">
              <span>Target Completion:</span>
              <span className="font-semibold text-slate-800">{project.targetCompletionDate}</span>
            </div>
            {project.nextRequiredAction && (
              <div className="text-emerald-800 font-medium pt-1 border-t border-slate-200/60 flex items-start gap-1.5">
                <span className="text-emerald-600">📌</span>
                <span className="line-clamp-2">{project.nextRequiredAction}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Card Actions Footer */}
      <div className="p-5 pt-0 flex flex-wrap gap-2">
        <Link
          href={projectUrl}
          className="flex-1 text-center py-2.5 px-4 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-colors"
        >
          Open Project
        </Link>
        {project.status === "snagging" || project.status === "ready_for_handover" ? (
          <Link
            href={`${projectUrl}/handover`}
            className="py-2.5 px-3 bg-[#2ec440] text-white text-xs font-bold rounded-xl hover:opacity-90 transition-opacity"
          >
            Review Handover
          </Link>
        ) : project.changeRequests.some((c) => c.status === "submitted") ? (
          <Link
            href={`${projectUrl}/changes`}
            className="py-2.5 px-3 bg-amber-500 text-white text-xs font-bold rounded-xl hover:opacity-90 transition-opacity"
          >
            Review Change
          </Link>
        ) : (
          <Link
            href={`${projectUrl}/progress`}
            className="py-2.5 px-3 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 transition-colors"
          >
            View Progress
          </Link>
        )}
      </div>
    </div>
  );
}
