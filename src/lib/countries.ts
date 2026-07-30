export const COUNTRIES = [
  { flag: "🇷🇼", name: "Rwanda",      code: "+250", digits: 9, hint: "788000000" },
  { flag: "🇺🇬", name: "Uganda",      code: "+256", digits: 9, hint: "712000000" },
  { flag: "🇰🇪", name: "Kenya",       code: "+254", digits: 9, hint: "712000000" },
  { flag: "🇹🇿", name: "Tanzania",    code: "+255", digits: 9, hint: "712000000" },
  { flag: "🇧🇮", name: "Burundi",     code: "+257", digits: 8, hint: "79000000"  },
  { flag: "🇨🇩", name: "DR Congo",    code: "+243", digits: 9, hint: "812000000" },
  { flag: "🇸🇸", name: "South Sudan", code: "+211", digits: 9, hint: "912000000" },
  { flag: "🇪🇹", name: "Ethiopia",    code: "+251", digits: 9, hint: "912000000" },
];

export type Country = typeof COUNTRIES[number];
