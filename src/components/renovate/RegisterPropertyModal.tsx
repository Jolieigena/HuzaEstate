"use client";

import { useId, useState, FormEvent } from "react";
import Dialog from "@/components/Dialog";
import { OccupancyStatus, OwnershipStatus, OWNERSHIP_STATUS_LABELS, PropertyType, PROPERTY_TYPE_LABELS, RenovationPropertyInfo } from "@/lib/renovate/types";

interface RegisterPropertyModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (property: RenovationPropertyInfo) => void;
}

export default function RegisterPropertyModal({ open, onClose, onSubmit }: RegisterPropertyModalProps) {
  const titleId = useId();
  const [name, setName] = useState("");
  const [propertyType, setPropertyType] = useState<PropertyType>("detached_house");
  const [ownershipStatus, setOwnershipStatus] = useState<OwnershipStatus>("owner");
  const [address, setAddress] = useState("");
  const [areaSqm, setAreaSqm] = useState("");
  const [floors, setFloors] = useState("1");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [constructionYear, setConstructionYear] = useState("");
  const [occupancy, setOccupancy] = useState<OccupancyStatus>("occupied");
  const [error, setError] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !address.trim()) {
      setError("Property name and address are required.");
      return;
    }
    onSubmit({
      source: "registered",
      name: name.trim(),
      imageUrl: "/hero-house.jpg",
      propertyType,
      ownershipStatus,
      address: address.trim(),
      location: address.trim(),
      coordinates: null,
      approxAreaSqm: areaSqm ? Number(areaSqm) : null,
      floors: floors ? Number(floors) : null,
      bedrooms: bedrooms ? Number(bedrooms) : null,
      bathrooms: bathrooms ? Number(bathrooms) : null,
      constructionYear: constructionYear ? Number(constructionYear) : null,
      occupancy,
      accessInfo: "",
      willBeOccupiedDuringRenovation: occupancy === "occupied" ? true : null,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} labelledBy={titleId} panelClassName="max-w-2xl">
      <form onSubmit={handleSubmit} className="p-6 sm:p-8">
        <h2 id={titleId} className="text-xl font-black text-slate-900 mb-1">
          Register another property
        </h2>
        <p className="text-slate-500 text-sm mb-6">Tell us about the property you&apos;d like to renovate. You can refine these details later in the assessment.</p>

        {error && <p className="text-red-600 text-sm font-semibold mb-4">{error}</p>}

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label htmlFor="reg-name" className="block text-sm font-bold text-slate-700 mb-1.5">
              Property name <span className="text-red-500">*</span>
            </label>
            <input id="reg-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Remera Family Home" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440] transition-colors" />
          </div>

          <div>
            <label htmlFor="reg-type" className="block text-sm font-bold text-slate-700 mb-1.5">
              Property type
            </label>
            <select id="reg-type" value={propertyType} onChange={(e) => setPropertyType(e.target.value as PropertyType)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20">
              {Object.entries(PROPERTY_TYPE_LABELS).map(([k, l]) => (
                <option key={k} value={k}>
                  {l}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="reg-ownership" className="block text-sm font-bold text-slate-700 mb-1.5">
              Ownership status
            </label>
            <select id="reg-ownership" value={ownershipStatus} onChange={(e) => setOwnershipStatus(e.target.value as OwnershipStatus)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20">
              {Object.entries(OWNERSHIP_STATUS_LABELS).map(([k, l]) => (
                <option key={k} value={k}>
                  {l}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="reg-address" className="block text-sm font-bold text-slate-700 mb-1.5">
              Address / location <span className="text-red-500">*</span>
            </label>
            <input id="reg-address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="e.g. Remera, Gasabo District, Kigali" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20" />
          </div>

          <div>
            <label htmlFor="reg-area" className="block text-sm font-bold text-slate-700 mb-1.5">
              Approximate area (sqm)
            </label>
            <input id="reg-area" type="number" min={0} value={areaSqm} onChange={(e) => setAreaSqm(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20" />
          </div>
          <div>
            <label htmlFor="reg-floors" className="block text-sm font-bold text-slate-700 mb-1.5">
              Number of floors
            </label>
            <input id="reg-floors" type="number" min={1} value={floors} onChange={(e) => setFloors(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20" />
          </div>
          <div>
            <label htmlFor="reg-bedrooms" className="block text-sm font-bold text-slate-700 mb-1.5">
              Number of bedrooms
            </label>
            <input id="reg-bedrooms" type="number" min={0} value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20" />
          </div>
          <div>
            <label htmlFor="reg-bathrooms" className="block text-sm font-bold text-slate-700 mb-1.5">
              Number of bathrooms
            </label>
            <input id="reg-bathrooms" type="number" min={0} value={bathrooms} onChange={(e) => setBathrooms(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20" />
          </div>
          <div>
            <label htmlFor="reg-year" className="block text-sm font-bold text-slate-700 mb-1.5">
              Approximate construction year
            </label>
            <input id="reg-year" type="number" min={1900} max={2100} value={constructionYear} onChange={(e) => setConstructionYear(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20" />
          </div>
          <div>
            <label htmlFor="reg-occupancy" className="block text-sm font-bold text-slate-700 mb-1.5">
              Current occupancy
            </label>
            <select id="reg-occupancy" value={occupancy} onChange={(e) => setOccupancy(e.target.value as OccupancyStatus)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20">
              <option value="occupied">Occupied</option>
              <option value="vacant">Vacant</option>
              <option value="partially_occupied">Partially occupied</option>
            </select>
          </div>
        </div>

        {ownershipStatus === "unconfirmed" && (
          <p className="mt-4 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            You can still save this as a draft, but requesting a professional review or contractor quotation later will require confirming ownership or permission first.
          </p>
        )}

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-6">
          <button type="button" onClick={onClose} className="px-5 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button type="submit" className="px-5 py-3 rounded-xl font-bold text-white bg-slate-900 hover:bg-[#2ec440] transition-colors shadow-lg">
            Save Property
          </button>
        </div>
      </form>
    </Dialog>
  );
}
