/**
 * Format date to dd/mm/yyyy format
 */
export function formatDate(date: Date | number): string {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Convert dd/mm/yyyy string to YYYY-MM-DD format for HTML date input
 */
export function convertToDateInputFormat(ddmmyyyy: string): string {
  if (!ddmmyyyy) return "";
  const parts = ddmmyyyy.split("/");
  if (parts.length !== 3) return "";
  const [day, month, year] = parts;
  return `${year}-${month}-${day}`;
}

/**
 * Convert YYYY-MM-DD format (from HTML date input) to dd/mm/yyyy string
 */
export function convertFromDateInputFormat(yyyymmdd: string): string {
  if (!yyyymmdd) return "";
  const parts = yyyymmdd.split("-");
  if (parts.length !== 3) return "";
  const [year, month, day] = parts;
  return `${day}/${month}/${year}`;
}
