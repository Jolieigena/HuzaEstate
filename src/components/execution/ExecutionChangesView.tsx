"use client";

import React, { useState } from "react";
import { ExecutionProject, ChangeRequest, ChangeOrder, CHANGE_STATUS_LABELS, ExecutionRole } from "../../lib/execution/types";
import { ChangeOrderService } from "../../lib/execution/executionService";
import { AddChangeRequestModal } from "./ExecutionModals";
import { canPerformExecutionAction } from "../../lib/execution/permissions";

interface ChangesViewProps {
  project: ExecutionProject;
  currentRole: ExecutionRole;
}

export function ExecutionChangesView({ project, currentRole }: ChangesViewProps) {
  const [activeTab, setActiveTab] = useState<"requests" | "orders">("requests");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const canApproveCustomer = canPerformExecutionAction(currentRole, "change_request.approve_customer");

  const handleAddChangeRequest = (data: any) => {
    ChangeOrderService.addRequest(
      project.id,
      {
        ...data,
        origin: currentRole === "customer" ? "customer" : "contractor",
        requestedByName: currentRole === "customer" ? project.customerName : project.contractorName,
        requestedByRole: currentRole,
        affectedRoomsOrPackages: ["Main Area"],
        supportingDocIds: [],
      },
      currentRole === "customer" ? project.customerName : project.contractorName,
      currentRole
    );
  };

  const handleApproveByCustomer = (reqId: string) => {
    ChangeOrderService.approveByCustomer(project.id, reqId, project.customerName);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Change Requests & Approved Change Orders</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Accepted quotation baseline remains unchanged. Approved variations create formal Change Order additions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-100 p-1 rounded-2xl border flex items-center gap-1 text-xs font-semibold">
            <button
              onClick={() => setActiveTab("requests")}
              className={`px-3 py-1.5 rounded-xl transition-colors ${
                activeTab === "requests" ? "bg-white text-slate-900 shadow-sm font-bold" : "text-slate-600"
              }`}
            >
              Change Requests ({project.changeRequests.length})
            </button>
            <button
              onClick={() => setActiveTab("orders")}
              className={`px-3 py-1.5 rounded-xl transition-colors ${
                activeTab === "orders" ? "bg-white text-slate-900 shadow-sm font-bold" : "text-slate-600"
              }`}
            >
              Approved Orders ({project.changeOrders.length})
            </button>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800"
          >
            + Raise Change Request
          </button>
        </div>
      </div>

      {activeTab === "requests" && (
        <div className="space-y-4">
          {project.changeRequests.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center text-slate-500 text-sm">
              No pending change requests.
            </div>
          ) : (
            project.changeRequests.map((req) => (
              <div key={req.id} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900 font-mono">{req.changeReference}</span>
                      <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                        {CHANGE_STATUS_LABELS[req.status]}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mt-1">{req.title}</h3>
                    <div className="text-xs text-slate-500">
                      Raised by <strong>{req.requestedByName}</strong> ({req.requestedByRole}) on {new Date(req.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="bg-slate-50 border rounded-2xl p-3 text-right text-xs">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Cost Impact</div>
                    <div className={`text-base font-bold ${req.costImpact >= 0 ? "text-amber-600" : "text-emerald-600"}`}>
                      {req.costImpact >= 0 ? "+" : ""}{req.costImpact.toLocaleString()} {project.currency}
                    </div>
                    <div className="text-[10px] text-slate-500">Schedule: +{req.scheduleImpactDays} days</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="bg-slate-50 p-3 rounded-2xl border">
                    <span className="font-bold text-slate-800 block mb-1">Description & Reason:</span>
                    <p className="text-slate-600">{req.description}</p>
                    <p className="text-slate-500 mt-1"><strong>Reason:</strong> {req.reason}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-2xl border">
                    <span className="font-bold text-slate-800 block mb-1">Professional Review:</span>
                    <p className="text-slate-600">{req.professionalRecommendation || "Pending Quantity Surveyor / Architect review."}</p>
                  </div>
                </div>

                {canApproveCustomer && req.status === "submitted" && (
                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      onClick={() => handleApproveByCustomer(req.id)}
                      className="px-5 py-2 bg-[#2ec440] text-white rounded-xl text-xs font-bold hover:opacity-90"
                    >
                      Approve & Issue Formal Change Order
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "orders" && (
        <div className="space-y-4">
          {project.changeOrders.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center text-slate-500 text-sm">
              No formal change orders issued yet.
            </div>
          ) : (
            project.changeOrders.map((co) => (
              <div key={co.id} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-3">
                <div className="flex justify-between items-start border-b pb-3">
                  <div>
                    <span className="text-xs font-bold font-mono text-[#2ec440]">{co.changeReference}</span>
                    <h3 className="text-base font-bold text-slate-900">{co.title}</h3>
                    <div className="text-xs text-slate-500">Approved by client <strong>{co.approvedByCustomerName}</strong> on {new Date(co.approvedAt).toLocaleDateString()}</div>
                  </div>

                  <div className="text-right text-xs">
                    <div className="text-emerald-700 font-bold text-base">+{co.costDelta.toLocaleString()} {project.currency}</div>
                    <div className="text-slate-500">+{co.scheduleDeltaDays} days</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-2xl border">
                  <div>
                    <span className="text-slate-400 block font-bold text-[10px]">Baseline Value Before</span>
                    <span className="font-bold text-slate-700">{co.baselineContractValueBefore.toLocaleString()} {project.currency}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-bold text-[10px]">Revised Value After</span>
                    <span className="font-bold text-slate-900">{co.baselineContractValueAfter.toLocaleString()} {project.currency}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <AddChangeRequestModal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddChangeRequest}
      />
    </div>
  );
}
