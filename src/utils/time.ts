export const getSecondsTime = (val?: unknown): number => {
  if (typeof val === "string") {
    const date = new Date(val);
    return isNaN(date.getTime())
      ? getSecondsTime(new Date())
      : getSecondsTime(date);
  }

  if (typeof val === "number") {
    return Math.floor(val > 1e12 ? val / 1000 : val);
  }

  if (val instanceof Date) {
    return getSecondsTime(val.getTime());
  }

  return getSecondsTime(new Date()); // Default to current time if input is invalid
};
