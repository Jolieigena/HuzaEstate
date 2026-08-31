const fs = require('fs');

const imageIds = [
  "1507427100689-2bf8574e32d4",
  "1720605739861-9f5110c7e529",
  "1682773083908-a0e9ffadd175",
  "1667504320745-eade6c25e053",
  "1708772565599-2c4e4b3ed9db",
  "1689013398932-b576a11e07a1",
  "1708772565588-33785e13aa46",
  "1682773083896-95176d8aecf8",
  "1600596542815-ffad4c1539a9",
  "1512917774080-9991f1c4c750",
  "1600607688969-a5bfcd646154",
  "1600596542815-ffad4c1539a9",
  "1518780664697-5b050e0bb626",
  "1564013799919-ab600027ffc6",
  "1605146768851-ea244b94238e",
  "1605810230434-7631ac76ec81",
  "1582268611958-ebfd161ef9cf",
  "1512917774080-9991f1c4c750",
  "1523217582562-09d0def993a6",
  "1598228726386-8a03bb3644f7",
];

const locations = [
  { city: "Kigali", locs: ["Nyarutarama", "Kiyovu", "Kimihurura", "Kacyiru", "Gacuriro", "Kagugu", "Kibagabaga", "Nyamirambo", "Remera", "Gisozi", "Kicukiro", "Kanombe", "Bunga", "Kanyinya"] },
  { city: "Rubavu", locs: ["Gisenyi", "Nyamyumba", "Rugerero"] },
  { city: "Musanze", locs: ["Ruhengeri", "Kinigi", "Muhoza"] },
  { city: "Huye", locs: ["Tumba", "Ngoma", "Mukura"] },
  { city: "Muhanga", locs: ["Nyamabuye", "Shyogwe", "Cyeza"] },
  { city: "Nyagatare", locs: ["Nyagatare", "Matimba", "Rwimiyaga"] },
  { city: "Rusizi", locs: ["Kamembe", "Gihundwe", "Mururu"] }
];

const tiers = [
  {
    name: "low",
    prob: 0.3,
    adjectives: ["Affordable", "Modest", "Simple", "Basic", "Budget", "Standard", "Starter", "Traditional"],
    types: [
      { t: "house", names: ["House", "Annexe", "Compound House", "Starter Home", "Shelter"] },
      { t: "apartment", names: ["Room", "Studio", "Basic Unit", "Shared Apartment"] },
      { t: "land", names: ["Small Plot", "Farming Land", "Local Plot"] }
    ],
    rentMin: 50,
    rentMax: 300,
    saleMin: 5000,
    saleMax: 30000,
    sqmMin: 20,
    sqmMax: 100,
    bedMin: 1,
    bedMax: 3
  },
  {
    name: "mid",
    prob: 0.5,
    adjectives: ["Modern", "Cozy", "Spacious", "Charming", "Family", "Classic", "Renovated", "Secure"],
    types: [
      { t: "house", names: ["Family Home", "Bungalow", "Residence", "Semi-detached House"] },
      { t: "apartment", names: ["Apartment", "Flat", "Condo", "Serviced Apartment"] },
      { t: "land", names: ["Residential Plot", "Development Land", "Farm"] }
    ],
    rentMin: 400,
    rentMax: 1500,
    saleMin: 40000,
    saleMax: 150000,
    sqmMin: 80,
    sqmMax: 250,
    bedMin: 2,
    bedMax: 4
  },
  {
    name: "high",
    prob: 0.2,
    adjectives: ["Luxury", "Elegant", "Beautiful", "Stunning", "Premium", "Exclusive", "Magnificent", "Prestigious"],
    types: [
      { t: "house", names: ["Villa", "Mansion", "Estate", "Retreat", "Luxury Home"] },
      { t: "apartment", names: ["Penthouse", "Luxury Loft", "Executive Suite", "Duplex"] },
      { t: "land", names: ["Prime Commercial Land", "Estate Lot", "Lakefront Plot"] }
    ],
    rentMin: 2000,
    rentMax: 6000,
    saleMin: 200000,
    saleMax: 1000000,
    sqmMin: 200,
    sqmMax: 1000,
    bedMin: 3,
    bedMax: 6
  }
];

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const properties = [];

for (let i = 1; i <= 80; i++) {
  const cityObj = randomChoice(locations);
  const city = cityObj.city;
  const location = randomChoice(cityObj.locs);
  
  const rand = Math.random();
  let tier;
  if (rand < 0.3) tier = tiers[0];
  else if (rand < 0.8) tier = tiers[1];
  else tier = tiers[2];

  const typeObj = randomChoice(tier.types);
  const propertyType = typeObj.t;
  const typeName = randomChoice(typeObj.names);
  const adj = randomChoice(tier.adjectives);
  const title = adj + " " + typeName + " in " + location;
  
  const isSale = Math.random() > 0.4;
  const type = isSale ? 'sale' : 'rent';
  
  let price, bedrooms, bathrooms, sqm;
  
  if (propertyType === 'land') {
    bedrooms = 0;
    bathrooms = 0;
    sqm = randomInt(tier.sqmMin * 2, tier.sqmMax * 5);
    price = isSale ? randomInt(tier.saleMin / 2, tier.saleMax / 2) : randomInt(tier.rentMin / 2, tier.rentMax / 2);
  } else {
    bedrooms = randomInt(tier.bedMin, tier.bedMax);
    bathrooms = Math.max(1, bedrooms - randomInt(0, 1));
    sqm = randomInt(tier.sqmMin, tier.sqmMax);
    price = isSale ? randomInt(tier.saleMin, tier.saleMax) : randomInt(tier.rentMin, tier.rentMax);
  }

  if (price > 10000) price = Math.floor(price / 1000) * 1000;
  else if (price > 1000) price = Math.floor(price / 100) * 100;
  else if (price > 100) price = Math.floor(price / 50) * 50;
  else price = Math.floor(price / 10) * 10;

  const currency = isSale ? "USD" : "USD/month";
  
  const imageUrlId = imageIds[(i - 1) % imageIds.length];
  const imageUrl = "https://images.unsplash.com/photo-" + imageUrlId + "?q=80&w=800&auto=format&fit=crop";
  
  const lat = -1.94 + (Math.random() - 0.5) * 1.5;
  const lng = 30.06 + (Math.random() - 0.5) * 1.5;

  let propStr = "  {\n";
  propStr += "    id: \"prop-" + i + "\",\n";
  propStr += "    title: \"" + title + "\",\n";
  propStr += "    description: \"A " + adj.toLowerCase() + " " + propertyType + " located in " + location + ", " + city + ". Fits " + tier.name + "-income budgets perfectly and offers great value for the area.\",\n";
  propStr += "    price: " + price + ",\n";
  propStr += "    currency: \"" + currency + "\",\n";
  propStr += "    location: \"" + location + "\",\n";
  propStr += "    city: \"" + city + "\",\n";
  propStr += "    bedrooms: " + bedrooms + ",\n";
  propStr += "    bathrooms: " + bathrooms + ",\n";
  propStr += "    sqm: " + sqm + ",\n";
  propStr += "    imageUrl: \"" + imageUrl + "\",\n";
  propStr += "    type: \"" + type + "\",\n";
  propStr += "    propertyType: \"" + propertyType + "\",\n";
  propStr += "    virtualTourUrl: \"https://my.matterport.com/show/?m=JGPnGQ6hosj\",\n";
  propStr += "    lat: " + lat.toFixed(3) + ",\n";
  propStr += "    lng: " + lng.toFixed(3) + "\n";
  propStr += "  }";
  properties.push(propStr);
}

let fileContent = "export interface Property {\n";
fileContent += "  id: string;\n";
fileContent += "  title: string;\n";
fileContent += "  description: string;\n";
fileContent += "  price: number;\n";
fileContent += "  currency: string;\n";
fileContent += "  location: string;\n";
fileContent += "  city: string;\n";
fileContent += "  bedrooms: number;\n";
fileContent += "  bathrooms: number;\n";
fileContent += "  sqm: number;\n";
fileContent += "  imageUrl: string;\n";
fileContent += "  type: 'sale' | 'rent';\n";
fileContent += "  propertyType: 'house' | 'apartment' | 'land';\n";
fileContent += "  virtualTourUrl?: string;\n";
fileContent += "  lat?: number;\n";
fileContent += "  lng?: number;\n";
fileContent += "}\n\n";
fileContent += "export const mockProperties: Property[] = [\n";
fileContent += properties.join(",\n");
fileContent += "\n];\n";

fs.writeFileSync('src/lib/data.ts', fileContent);
