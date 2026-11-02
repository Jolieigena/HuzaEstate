"use client";

import { useRef, useState, FormEvent } from "react";
import Image from "@/components/PropertyImage";
import Select from "@/components/shared/Select";
import { getMyProperties, MyProperty } from "@/lib/myProperties";
import { newId } from "@/lib/renovate/factory";
import { PropertyType, PROPERTY_TYPE_LABELS, RenovationPropertyInfo, UploadedFile } from "@/lib/renovate/types";

const MAX_PHOTOS = 6;
const MAX_SIDE_PX = 900;

interface PropertySelectorProps {
  onSelectOwned: (property: MyProperty) => void;
  /** Any property the person describes, with the photos they added. It does not have to be one of theirs on the site. */
  onRegister: (property: RenovationPropertyInfo, photos: UploadedFile[]) => void;
}

/** A photo made small enough to keep with the project (a JPEG of at most 900 px on its longer side), as a data address, so it is
 *  still there when the page is reopened. Returns null for a file the browser cannot read as a picture. */
function readPhoto(file: File): Promise<UploadedFile | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      const scale = Math.min(1, MAX_SIDE_PX / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      const previewUrl = canvas.toDataURL("image/jpeg", 0.78);
      resolve({ id: newId("file"), name: file.name, fileType: "jpg", size: Math.round(previewUrl.length * 0.75), category: "room_photo", previewUrl, status: "uploaded", uploadedAt: new Date().toISOString(), uploadedBy: "You" });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}

const inputClass = "w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-[15px] focus:outline-none focus:ring-4 focus:ring-[#2ec440]/15 focus:border-[#2ec440] transition";

export default function PropertySelector({ onSelectOwned, onRegister }: PropertySelectorProps) {
  const properties = getMyProperties();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [photos, setPhotos] = useState<UploadedFile[]>([]);
  const [location, setLocation] = useState("");
  const [propertyType, setPropertyType] = useState<PropertyType>("detached_house");
  const [error, setError] = useState("");
  const [photoError, setPhotoError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addPhotos = async (list: FileList | null) => {
    if (!list || list.length === 0) return;
    setPhotoError("");
    const room = MAX_PHOTOS - photos.length;
    const chosen = Array.from(list).filter((f) => f.type.startsWith("image/")).slice(0, Math.max(room, 0));
    if (chosen.length < list.length) setPhotoError(room <= 0 ? `You can add up to ${MAX_PHOTOS} photos.` : "Only pictures can be added here, up to six in all.");
    const read = (await Promise.all(chosen.map(readPhoto))).filter((p): p is UploadedFile => p !== null);
    if (read.length) setPhotos((prev) => [...prev, ...read].slice(0, MAX_PHOTOS));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!location.trim()) {
      setError("Tell us where the property is.");
      return;
    }
    onRegister(
      {
        source: "registered",
        name: location.trim(),
        imageUrl: photos[0]?.previewUrl ?? "/hero-house.jpg",
        propertyType,
        ownershipStatus: null,
        address: location.trim(),
        location: location.trim(),
        coordinates: null,
        approxAreaSqm: null,
        floors: null,
        bedrooms: null,
        bathrooms: null,
        constructionYear: null,
        occupancy: null,
        accessInfo: "",
        willBeOccupiedDuringRenovation: null,
      },
      photos,
    );
  };

  return (
    <div className="max-w-3xl">
      <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-8">What are you renovating?</h2>

      <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-8 shadow-sm">
        <p className="text-sm font-bold text-slate-700 mb-3">Photos of the property</p>
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            void addPhotos(e.dataTransfer.files);
          }}
          className={`rounded-2xl border-2 border-dashed p-5 transition-colors ${dragOver ? "border-[#2ec440] bg-[#2ec440]/5" : "border-slate-200 bg-slate-50"}`}
        >
          {photos.length > 0 && (
            <ul className="mb-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {photos.map((photo) => (
                <li key={photo.id} className="relative aspect-[4/3] overflow-hidden rounded-xl border border-slate-200 bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.previewUrl} alt={photo.name} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setPhotos((prev) => prev.filter((p) => p.id !== photo.id))}
                    aria-label={`Remove ${photo.name}`}
                    className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-slate-900/70 text-white hover:bg-slate-900"
                  >
                    <span aria-hidden="true">×</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="flex flex-col items-center text-center">
            <svg className="h-8 w-8 text-slate-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M2.25 15.75l5.16-5.16a2.25 2.25 0 013.18 0l5.16 5.16m-1.5-1.5l1.41-1.41a2.25 2.25 0 013.18 0l2.25 2.25m-18 4.5h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zM13.5 9.75h.008v.008H13.5V9.75z" />
            </svg>
            <button type="button" onClick={() => inputRef.current?.click()} disabled={photos.length >= MAX_PHOTOS} className="text-sm font-bold text-[#219b31] hover:underline disabled:text-slate-400 disabled:no-underline">
              {photos.length === 0 ? "Add photos" : "Add more photos"}
            </button>
            <p className="mt-1 text-xs text-slate-400">or drop them here · up to {MAX_PHOTOS}</p>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept="image/*"
              className="sr-only"
              onChange={(e) => {
                void addPhotos(e.target.files);
                e.target.value = "";
              }}
            />
          </div>
        </div>
        {photoError && <p className="mt-2 text-xs font-semibold text-amber-700">{photoError}</p>}

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="property-location" className="block text-sm font-bold text-slate-700 mb-2">
              Where is it?
            </label>
            <input
              id="property-location"
              value={location}
              onChange={(e) => {
                setLocation(e.target.value);
                if (error) setError("");
              }}
              placeholder="e.g. Remera, Gasabo, Kigali"
              aria-invalid={Boolean(error)}
              className={`${inputClass} ${error ? "border-red-300" : ""}`}
            />
            {error && <p className="mt-1.5 text-sm font-semibold text-red-600">{error}</p>}
          </div>
          <div className="sm:col-span-2 sm:max-w-xs">
            <label htmlFor="property-type" className="block text-sm font-bold text-slate-700 mb-2">
              What kind of property?
            </label>
            <Select id="property-type" value={propertyType} onChange={(e) => setPropertyType(e.target.value as PropertyType)} className={inputClass}>
              {Object.entries(PROPERTY_TYPE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-7 py-3.5 text-[15px] font-bold text-white shadow-lg transition-colors hover:bg-[#2ec440]">
            Continue
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>
        </div>
      </form>

      {properties.length > 0 && (
        <div className="mt-10">
          <h3 className="text-sm font-bold text-slate-500 mb-4">Or pick one of your properties</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {properties.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setSelectedId(p.id);
                  onSelectOwned(p);
                }}
                className={`text-left bg-white rounded-2xl overflow-hidden border shadow-sm hover:shadow-lg transition-all group ${
                  selectedId === p.id ? "border-[#2ec440] ring-2 ring-[#2ec440]/20" : "border-slate-100"
                }`}
              >
                <div className="relative h-36 overflow-hidden">
                  <Image src={p.imageUrl} alt="" fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 768px) 100vw, 33vw" />
                </div>
                <div className="p-4">
                  <h4 className="font-bold text-slate-900 truncate mb-0.5">{p.name}</h4>
                  <p className="text-sm text-slate-500 truncate mb-2">{p.location}</p>
                  <p className="text-xs font-semibold text-slate-400">
                    {p.bedrooms} bed · {p.bathrooms} bath · {p.areaSqm} sqm
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
