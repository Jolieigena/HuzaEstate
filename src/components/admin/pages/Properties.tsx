"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { mockProperties } from "@/lib/data";
import { useAuth } from "@/lib/auth-context";
import { hasPermission } from "@/lib/admin/permissions";
import type { AdminRole } from "@/lib/admin/types";
import { PageFrame, Card, AdminTable, StatusPill, fieldClass, formatMoney } from "../ui";

export function PropertiesListPage() {
  const { account } = useAuth();
  const adminRole = account?.adminRole as AdminRole | undefined;
  const canView = adminRole && hasPermission(adminRole, "listings.view");

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "sale" | "rent">("all");

  const filteredProperties = useMemo(() => {
    return mockProperties.filter((p) => {
      const matchesSearch = !search.trim() || `${p.title} ${p.location} ${p.city}`.toLowerCase().includes(search.toLowerCase());
      const matchesType = filterType === "all" || p.type === filterType;
      return matchesSearch && matchesType;
    });
  }, [search, filterType]);

  const activeCount = mockProperties.length; // Simplified for this view
  const saleCount = mockProperties.filter(p => p.type === 'sale').length;
  const rentCount = mockProperties.filter(p => p.type === 'rent').length;

  if (!canView) {
    return (
      <PageFrame title="All Properties (Catalog)" description="">
        <Card className="border-red-100 bg-red-50/60 py-10 text-center shadow-none">
          <h3 className="font-black text-red-700">Access denied</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-red-700/80">You do not have permission to view properties.</p>
        </Card>
      </PageFrame>
    );
  }

  return (
    <PageFrame
      title="All Properties (Catalog)"
      description="A global, read-only view of all property inventory active within the system."
    >
      {/* High Level Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <Card className="flex flex-col border-l-4 border-l-slate-900">
          <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Total Inventory</span>
          <span className="text-3xl font-black text-slate-900 mt-2">{activeCount}</span>
        </Card>
        <Card className="flex flex-col border-l-4 border-l-[#2ec440]">
          <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">For Sale</span>
          <span className="text-3xl font-black text-slate-900 mt-2">{saleCount}</span>
        </Card>
        <Card className="flex flex-col border-l-4 border-l-blue-500">
          <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">For Rent</span>
          <span className="text-3xl font-black text-slate-900 mt-2">{rentCount}</span>
        </Card>
      </div>

      <Card className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-grow">
            <input
              type="text"
              placeholder="Search by title, location or city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={fieldClass}
            />
          </div>
          <div className="w-full sm:w-48">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as "all" | "sale" | "rent")}
              className={fieldClass}
            >
              <option value="all">All Types</option>
              <option value="sale">For Sale</option>
              <option value="rent">For Rent</option>
            </select>
          </div>
        </div>
      </Card>

      <AdminTable headers={["Property", "Location", "Type", "Price", "Specs", "Status", "Action"]}>
        {filteredProperties.length === 0 ? (
          <tr>
            <td colSpan={7} className="px-6 py-12 text-center text-slate-500 text-sm">
              No properties match your search criteria.
            </td>
          </tr>
        ) : (
          filteredProperties.map((property) => (
            <tr key={property.id} className="hover:bg-slate-50/50 transition-colors">
              <td className="px-6 py-4">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-16 relative rounded-lg overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200">
                    <Image src={property.imageUrl} alt={property.title} fill className="object-cover" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm max-w-[200px] truncate">{property.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{property.id}</p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <p className="text-sm font-medium text-slate-900">{property.city}</p>
                <p className="text-xs text-slate-500">{property.location}</p>
              </td>
              <td className="px-6 py-4">
                <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider ${property.type === 'sale' ? 'bg-[#2ec440]/10 text-[#219b31]' : 'bg-blue-50 text-blue-700'}`}>
                  {property.type === 'sale' ? 'For Sale' : 'For Rent'}
                </span>
              </td>
              <td className="px-6 py-4">
                <p className="text-sm font-bold text-slate-900">{formatMoney(property.price)}</p>
                {property.type === 'rent' && <p className="text-[10px] text-slate-500 uppercase tracking-wider">Per Month</p>}
              </td>
              <td className="px-6 py-4 text-xs text-slate-600">
                {property.bedrooms} Beds &middot; {property.bathrooms} Baths<br />
                {property.sqm} sqm
              </td>
              <td className="px-6 py-4">
                <StatusPill status="published" />
              </td>
              <td className="px-6 py-4">
                <Link
                  href={`/properties/${property.id}`}
                  target="_blank"
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  View Public
                </Link>
              </td>
            </tr>
          ))
        )}
      </AdminTable>
    </PageFrame>
  );
}
