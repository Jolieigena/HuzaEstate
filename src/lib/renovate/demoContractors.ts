import { DemoContractor } from "./types";

// A small, clearly-marked set of demo contractors for the prototype
// quotation-request flow. No real contractors are contacted and no
// payments are processed.
export const DEMO_CONTRACTORS: DemoContractor[] = [
  { id: "renov-con-1", companyName: "Kigali Renovate Co.", location: "Kigali, Rwanda", services: ["Kitchens", "Bathrooms", "Full renovations"], verified: true, rating: 4.7, completedProjects: 112, estimatedResponseTime: "2-3 business days" },
  { id: "renov-con-2", companyName: "Urumuri Build & Renovate", location: "Kigali, Rwanda", services: ["Structural work", "Extensions", "Roofing"], verified: true, rating: 4.8, completedProjects: 76, estimatedResponseTime: "3-4 business days" },
  { id: "renov-con-3", companyName: "Isuku Interiors", location: "Kigali, Rwanda", services: ["Interior finishes", "Painting", "Flooring"], verified: true, rating: 4.6, completedProjects: 94, estimatedResponseTime: "1-2 business days" },
  { id: "renov-con-4", companyName: "Gasabo General Contractors", location: "Gasabo, Kigali", services: ["Electrical", "Plumbing", "General renovation"], verified: true, rating: 4.5, completedProjects: 58, estimatedResponseTime: "2-3 business days" },
  { id: "renov-con-5", companyName: "Amahoro Landscaping & Exteriors", location: "Kigali, Rwanda", services: ["Landscaping", "Exterior finishes", "Facades"], verified: false, rating: 4.3, completedProjects: 27, estimatedResponseTime: "4-5 business days" },
  { id: "renov-con-6", companyName: "Kicukiro Craft Builders", location: "Kicukiro, Kigali", services: ["Kitchens", "Cabinetry", "Fixtures"], verified: true, rating: 4.4, completedProjects: 41, estimatedResponseTime: "3 business days" },
];
