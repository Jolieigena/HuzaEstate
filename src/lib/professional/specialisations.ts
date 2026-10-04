/** The specialisations a professional can pick on their profile, grouped for the picker. Not
 *  exhaustive on purpose: the picker also lets someone add their own, so a trade missing here
 *  doesn't block anyone. The backend stores the chosen names as plain strings. */
export interface SpecialisationGroup {
  label: string;
  options: string[];
}

export const SPECIALISATION_GROUPS: SpecialisationGroup[] = [
  {
    label: "Design & planning",
    options: ["Architect", "Interior Designer", "Landscape Architect", "Urban Planner", "3D Visualisation", "Space Planner", "Lighting Designer", "Furniture Designer"],
  },
  {
    label: "Engineering",
    options: ["Structural Engineer", "Civil Engineer", "Mechanical Engineer", "Electrical Engineer", "Geotechnical Engineer", "Environmental Consultant", "Fire Safety Engineer", "Solar & Energy Engineer", "Water & Sanitation Engineer"],
  },
  {
    label: "Surveying & cost",
    options: ["Land Surveyor", "Quantity Surveyor", "Building Surveyor", "Cost Estimator", "Property Valuer"],
  },
  {
    label: "Construction management",
    options: ["Project Manager", "Construction Manager", "General Contractor", "Site Supervisor", "Health & Safety Officer", "Building Inspector"],
  },
  {
    label: "Trades & finishing",
    options: ["Bricklayer / Mason", "Carpenter", "Electrician", "Plumber", "Painter", "Tiler", "Roofer", "Welder", "Plasterer", "Glazier", "HVAC Technician", "Landscaper", "Flooring Installer", "Steel Fixer"],
  },
  {
    label: "Renovation & maintenance",
    options: ["Renovation Specialist", "Home Inspector", "Waterproofing Specialist", "Facilities Manager", "Pest Control"],
  },
  {
    label: "Real estate & advisory",
    options: ["Real Estate Agent", "Property Manager", "Property Developer", "Conveyancer", "Property Lawyer", "Mortgage Advisor", "Real Estate Consultant", "Home Stager", "Real Estate Photographer"],
  },
];

export const MAX_SPECIALISATIONS = 8;
