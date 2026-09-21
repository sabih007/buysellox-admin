export type City = {
  name: string;
  slug: string;
  province: string;
  lat: number;
  lng: number;
};

export const cities: City[] = [
  { name: "Karachi", slug: "karachi", province: "Sindh", lat: 24.8607, lng: 67.0011 },
  { name: "Lahore", slug: "lahore", province: "Punjab", lat: 31.5497, lng: 74.3436 },
  { name: "Islamabad", slug: "islamabad", province: "Islamabad Capital Territory", lat: 33.6844, lng: 73.0479 },
  { name: "Rawalpindi", slug: "rawalpindi", province: "Punjab", lat: 33.5651, lng: 73.0169 },
  { name: "Faisalabad", slug: "faisalabad", province: "Punjab", lat: 31.4504, lng: 73.135 },
  { name: "Multan", slug: "multan", province: "Punjab", lat: 30.1575, lng: 71.5249 },
  { name: "Gujranwala", slug: "gujranwala", province: "Punjab", lat: 32.1877, lng: 74.1945 },
  { name: "Peshawar", slug: "peshawar", province: "Khyber Pakhtunkhwa", lat: 34.0151, lng: 71.5249 },
  { name: "Quetta", slug: "quetta", province: "Balochistan", lat: 30.1798, lng: 66.975 },
  { name: "Sialkot", slug: "sialkot", province: "Punjab", lat: 32.4945, lng: 74.5229 },
  { name: "Bahawalpur", slug: "bahawalpur", province: "Punjab", lat: 29.3956, lng: 71.6836 },
  { name: "Sargodha", slug: "sargodha", province: "Punjab", lat: 32.0836, lng: 72.6711 },
  { name: "Hyderabad", slug: "hyderabad", province: "Sindh", lat: 25.396, lng: 68.3578 },
  { name: "Sukkur", slug: "sukkur", province: "Sindh", lat: 27.7052, lng: 68.8574 },
  { name: "Abbottabad", slug: "abbottabad", province: "Khyber Pakhtunkhwa", lat: 34.1688, lng: 73.2215 },
  { name: "Sahiwal", slug: "sahiwal", province: "Punjab", lat: 30.6682, lng: 73.1114 },
  { name: "Rahim Yar Khan", slug: "rahim-yar-khan", province: "Punjab", lat: 28.4212, lng: 70.2989 },
  { name: "Sheikhupura", slug: "sheikhupura", province: "Punjab", lat: 31.7131, lng: 73.9783 },
  { name: "Gujrat", slug: "gujrat", province: "Punjab", lat: 32.5738, lng: 74.0789 },
  { name: "Mardan", slug: "mardan", province: "Khyber Pakhtunkhwa", lat: 34.1989, lng: 72.0404 },
];

export const citiesBySlug: Record<string, City> = Object.fromEntries(
  cities.map((c) => [c.slug, c])
);

export function getCity(slug: string): City | undefined {
  return citiesBySlug[slug];
}

/** profiles.city stores the display name (e.g. "Karachi"), not the slug. */
export const citiesByName: Record<string, City> = Object.fromEntries(
  cities.map((c) => [c.name, c])
);

export function getCityByName(name: string): City | undefined {
  return citiesByName[name];
}
