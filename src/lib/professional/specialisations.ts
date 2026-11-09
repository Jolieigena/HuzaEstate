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
    label: "Building trades",
    options: ["Bricklayer / Mason", "Stone Mason", "Concrete Contractor", "Steel Fixer", "Carpenter", "Roofer", "Welder", "Scaffolder", "Excavation & Earthworks"],
  },
  {
    label: "Plumbing, water & electrical",
    options: ["Plumber", "Water Supply & Borehole", "Drainage & Sewer Specialist", "Water Tank Installer", "Electrician", "Solar Installer", "HVAC Technician"],
  },
  {
    label: "Finishing trades",
    options: ["Painter", "Plasterer", "Tiler", "Flooring Installer", "Gypsum Ceiling Installer", "Wall Panel Installer", "Door & Window Fitter", "Glazier", "Balustrade & Guardrail Fitter", "Landscaper"],
  },
  {
    label: "Cleaning, laundry & waste",
    options: ["House Cleaner", "Carpet & Upholstery Cleaner", "Window Cleaner", "Laundry & Dry Cleaning", "Post-construction Cleaner", "Water Tank Cleaner", "Waste Collection", "Septic Tank Emptying", "Fumigation Specialist"],
  },
  {
    label: "Garden & outdoor care",
    options: ["Gardener", "Lawn & Hedge Care", "Tree Trimmer", "Swimming Pool Maintenance"],
  },
  {
    label: "Home repairs & upkeep",
    options: ["Handyman", "Appliance Repair", "Furniture Repair & Upholstery", "Curtain & Blinds Installer", "Interior Decorator", "Locksmith", "Moving & Storage"],
  },
  {
    label: "Security, power & connectivity",
    options: ["Security Guard Service", "CCTV & Alarm Installer", "Fire Extinguisher Servicing", "Generator & Inverter Technician", "Solar Panel Maintenance", "Refrigeration & AC Technician", "TV & Satellite Installer", "Internet & Wi-Fi Installer", "Gas Installer"],
  },
  {
    label: "Home care & utilities",
    options: ["House Manager / Caretaker", "Water Delivery"],
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
