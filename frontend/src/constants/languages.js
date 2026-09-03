export const languages = [
  ["FR", "French"], ["EN", "English"], ["GR", "Greek"], ["ES", "Spanish"],
  ["DE", "German"], ["IT", "Italian"], ["PT", "Portuguese"], ["NL", "Dutch"],
  ["AR", "Arabic"], ["RU", "Russian"], ["ZH", "Chinese"], ["JA", "Japanese"],
];

export const languageLabel = (code) => {
  const language = languages.find(([value]) => value === code);
  return language ? `${language[1]} (${language[0]})` : code || "Unknown";
};
