export type AttributeField = {
  key: string;
  label: string;
  type: "text" | "number" | "select" | "boolean" | "measure";
  options?: string[];
  /** Selectable units for a `measure` field, e.g. Marla / Sq. Ft. The chosen unit is stored under `${key}_unit`. */
  units?: string[];
  required?: boolean;
  unit?: string;
};

/** Common area/size units used across Pakistani property listings. */
export const AREA_UNITS = ["Marla", "Kanal", "Sq. Ft", "Sq. Yd", "Sq. M", "Acre"];

export type Subcategory = {
  name: string;
  slug: string;
};

export type Category = {
  name: string;
  slug: string;
  subcategories: Subcategory[];
  /** Dynamic attribute fields rendered on the post-listing form for this category. */
  attributes: AttributeField[];
  hasCondition?: boolean;
};

export const categories: Category[] = [
  {
    name: "Property for Sale",
    slug: "property-for-sale",
    subcategories: [
      { name: "Houses", slug: "houses" },
      { name: "Plots", slug: "plots" },
      { name: "Flats/Apartments", slug: "flats-apartments" },
      { name: "Shops/Offices", slug: "shops-offices" },
      { name: "Agricultural Land", slug: "agricultural-land" },
    ],
    attributes: [
      { key: "bedrooms", label: "Bedrooms", type: "number" },
      { key: "bathrooms", label: "Bathrooms", type: "number" },
      { key: "area", label: "Area / Size", type: "measure", units: AREA_UNITS },
      { key: "furnished", label: "Furnished", type: "boolean" },
      { key: "floor", label: "Floor", type: "text" },
      {
        key: "plot_type",
        label: "Plot Type",
        type: "select",
        options: ["Residential", "Commercial"],
      },
      {
        key: "possession_status",
        label: "Possession Status",
        type: "select",
        options: ["Immediate", "Under Construction", "On Booking"],
      },
    ],
  },
  {
    name: "Property for Rent",
    slug: "property-for-rent",
    subcategories: [
      { name: "Houses", slug: "houses" },
      { name: "Flats/Apartments", slug: "flats-apartments" },
      { name: "Rooms", slug: "rooms" },
      { name: "Shops/Offices", slug: "shops-offices" },
    ],
    attributes: [
      { key: "bedrooms", label: "Bedrooms", type: "number" },
      { key: "bathrooms", label: "Bathrooms", type: "number" },
      { key: "area", label: "Area / Size", type: "measure", units: AREA_UNITS },
      { key: "furnished", label: "Furnished", type: "boolean" },
      { key: "floor", label: "Floor", type: "text" },
    ],
  },
  {
    name: "Vehicles",
    slug: "vehicles",
    subcategories: [
      { name: "Cars", slug: "cars" },
      { name: "Bikes", slug: "bikes" },
      { name: "Auto Parts & Accessories", slug: "auto-parts-accessories" },
      { name: "Trucks/Buses", slug: "trucks-buses" },
    ],
    hasCondition: true,
    attributes: [
      { key: "make", label: "Make", type: "text", required: true },
      { key: "model", label: "Model", type: "text", required: true },
      { key: "year", label: "Year", type: "number" },
      { key: "mileage", label: "Mileage", type: "number", unit: "km" },
      {
        key: "fuel_type",
        label: "Fuel Type",
        type: "select",
        options: ["Petrol", "Diesel", "CNG", "Hybrid", "Electric"],
      },
      {
        key: "transmission",
        label: "Transmission",
        type: "select",
        options: ["Manual", "Automatic"],
      },
    ],
  },
  {
    name: "Mobiles",
    slug: "mobiles",
    subcategories: [
      { name: "Mobile Phones", slug: "mobile-phones" },
      { name: "Tablets", slug: "tablets" },
      { name: "Accessories", slug: "accessories" },
    ],
    hasCondition: true,
    attributes: [
      { key: "brand", label: "Brand", type: "text", required: true },
      { key: "model", label: "Model", type: "text" },
      { key: "storage", label: "Storage", type: "text", unit: "GB" },
      { key: "pta_approved", label: "PTA Approved", type: "boolean" },
    ],
  },
  {
    name: "Electronics & Appliances",
    slug: "electronics-appliances",
    subcategories: [
      { name: "TVs", slug: "tvs" },
      { name: "Computers/Laptops", slug: "computers-laptops" },
      { name: "ACs", slug: "acs" },
      { name: "Fridges", slug: "fridges" },
      { name: "Kitchen Appliances", slug: "kitchen-appliances" },
    ],
    hasCondition: true,
    attributes: [
      { key: "brand", label: "Brand", type: "text" },
      { key: "model", label: "Model", type: "text" },
    ],
  },
  {
    name: "Animals",
    slug: "animals",
    subcategories: [
      { name: "Pets", slug: "pets" },
      { name: "Livestock", slug: "livestock" },
      { name: "Poultry", slug: "poultry" },
    ],
    attributes: [
      { key: "species", label: "Species", type: "text" },
      { key: "breed", label: "Breed", type: "text" },
      { key: "age", label: "Age", type: "text" },
      { key: "vaccinated", label: "Vaccinated", type: "boolean" },
    ],
  },
  {
    name: "Furniture & Home",
    slug: "furniture-home",
    subcategories: [
      { name: "Sofas", slug: "sofas" },
      { name: "Beds", slug: "beds" },
      { name: "Tables", slug: "tables" },
      { name: "Home Decor", slug: "home-decor" },
    ],
    hasCondition: true,
    attributes: [{ key: "material", label: "Material", type: "text" }],
  },
  {
    name: "Fashion & Beauty",
    slug: "fashion-beauty",
    subcategories: [
      { name: "Clothing", slug: "clothing" },
      { name: "Watches", slug: "watches" },
      { name: "Footwear", slug: "footwear" },
    ],
    hasCondition: true,
    attributes: [
      { key: "brand", label: "Brand", type: "text" },
      { key: "size", label: "Size", type: "text" },
    ],
  },
  {
    name: "Business & Industry",
    slug: "business-industry",
    subcategories: [
      { name: "Machinery", slug: "machinery" },
      { name: "Equipment", slug: "equipment" },
      { name: "Agriculture", slug: "agriculture" },
    ],
    hasCondition: true,
    attributes: [{ key: "brand", label: "Brand/Make", type: "text" }],
  },
];

export const categoriesBySlug: Record<string, Category> = Object.fromEntries(
  categories.map((c) => [c.slug, c])
);

export function getCategory(slug: string): Category | undefined {
  return categoriesBySlug[slug];
}
