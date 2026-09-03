export const ages = [
  ["young_children", "Young children (0–6)"],
  ["children", "Children (7–11)"],
  ["teenagers", "Teenagers (12–17)"],
  ["adults", "Adults (18+)"]
];

export const ageLabel = (value) => ages.find(([code]) => code === value)?.[1] || value || "Unknown";
export const ageBadgeLabel = (value) => ({ young_children: "Young · 0–6", children: "Child · 7–11", teenagers: "Teens · 12–17", adults: "Adult · 18+" }[value] || value || "Unknown");
