import { DemoProfessional } from "./types";

// A small, clearly-marked set of demo professionals for the prototype
// request-review flow. No real professionals are contacted.
export const DEMO_PROFESSIONALS: DemoProfessional[] = [
  {
    id: "pro-1",
    name: "Aline Uwase",
    profession: "Registered Architect",
    location: "Kigali, Rwanda",
    verified: true,
    rating: 4.8,
    completedReviews: 63,
    estimatedResponseTime: "2-3 business days",
  },
  {
    id: "pro-2",
    name: "Jean-Paul Nshimiyimana",
    profession: "Structural Engineer",
    location: "Kigali, Rwanda",
    verified: true,
    rating: 4.9,
    completedReviews: 41,
    estimatedResponseTime: "3-4 business days",
  },
  {
    id: "pro-3",
    name: "Diane Mukamana",
    profession: "Quantity Surveyor",
    location: "Kigali, Rwanda",
    verified: true,
    rating: 4.7,
    completedReviews: 58,
    estimatedResponseTime: "2 business days",
  },
  {
    id: "pro-4",
    name: "Eric Habimana",
    profession: "Sustainability Consultant",
    location: "Kigali, Rwanda",
    verified: false,
    rating: 4.5,
    completedReviews: 19,
    estimatedResponseTime: "4-5 business days",
  },
];
