export const format = (ms) => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;

  if (minutes > 0) return `${minutes}m ${rest}s`;
  return `${rest}s`;
};

export const sleep = (ms = 300) => new Promise((r) => setTimeout(r, ms));

export const standardize = (date) => Math.floor(date.getTime() / 1000);

export const labels = {
  [0]:      "None",
  [36e2]:   "1 hour",
  [108e2]:  "3 hours",
  [864e2]:  "24 hours",
  [2592e2]: "3 days",
  [6048e2]: "7 days",
};