/** The services a professional (an individual or a firm) can offer, grouped the way the shop groups what it sells (plumbing, tiles, glass,
 *  ceilings and so on), plus the design and engineering work around a building. The Professionals page shows one chip for each category that
 *  has someone in it; a professional belongs to a category when one of their specialisations is listed in it. */
export interface ServiceCategory {
  /** Also the menu key, so the administrator can hide, rename and reorder them in Settings. */
  key: string;
  label: string;
  specialisations: string[];
}

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  { key: "plumbing", label: "Plumbing & water", specialisations: ["Plumber", "Water Supply & Borehole", "Drainage & Sewer Specialist", "Water Tank Installer", "Water & Sanitation Engineer"] },
  { key: "electrical", label: "Electrical, solar & HVAC", specialisations: ["Electrician", "Solar Installer", "HVAC Technician", "Electrical Engineer", "Solar & Energy Engineer", "Mechanical Engineer"] },
  { key: "masonry", label: "Masonry & concrete", specialisations: ["Bricklayer / Mason", "Stone Mason", "Concrete Contractor", "Steel Fixer"] },
  { key: "roofing", label: "Roofing", specialisations: ["Roofer"] },
  { key: "carpentry", label: "Carpentry & timber", specialisations: ["Carpenter", "Door & Window Fitter"] },
  { key: "painting", label: "Painting & plastering", specialisations: ["Painter", "Plasterer"] },
  { key: "tiling", label: "Tiling & flooring", specialisations: ["Tiler", "Flooring Installer"] },
  { key: "ceilings", label: "Ceilings & wall panels", specialisations: ["Gypsum Ceiling Installer", "Wall Panel Installer"] },
  { key: "glass", label: "Doors, windows & glass", specialisations: ["Door & Window Fitter", "Glazier"] },
  { key: "metalwork", label: "Welding & guardrails", specialisations: ["Welder", "Balustrade & Guardrail Fitter"] },
  { key: "earthworks", label: "Earthworks & scaffolding", specialisations: ["Excavation & Earthworks", "Scaffolder"] },
  { key: "landscaping", label: "Landscaping", specialisations: ["Landscaper", "Landscape Architect"] },
  { key: "design", label: "Design & planning", specialisations: ["Architect", "Interior Designer", "Space Planner", "Lighting Designer", "3D Visualisation", "Furniture Designer", "Home Stager", "Urban Planner"] },
  { key: "engineering", label: "Engineering", specialisations: ["Structural Engineer", "Civil Engineer", "Mechanical Engineer", "Electrical Engineer", "Geotechnical Engineer", "Environmental Consultant", "Fire Safety Engineer", "Solar & Energy Engineer", "Water & Sanitation Engineer"] },
  { key: "management", label: "Project & site management", specialisations: ["General Contractor", "Project Manager", "Construction Manager", "Site Supervisor", "Renovation Specialist", "Quantity Surveyor", "Building Inspector"] },
];

const norm = (value: string) => value.trim().toLowerCase();

/** Whether a professional with these specialisations offers something in the category. */
export function inServiceCategory(specialisations: string[], category: ServiceCategory): boolean {
  const wanted = new Set(category.specialisations.map(norm));
  return specialisations.some((s) => wanted.has(norm(s)));
}
