/**
 * Shared daily sequential document number generator in Thai Buddhist Era (พ.ศ.)
 * Format: XXXYYMMDD-NNN (e.g. POS691113-001, BKG691113-001, RCV691113-001, ISS691113-001)
 */

export function getThaiDatePrefix(date: Date = new Date()): string {
  // Format in Asia/Bangkok timezone to ensure day rollover matches Thailand local midnight
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const yearAD = Number(parts.find((p) => p.type === "year")?.value ?? date.getFullYear());
  const month = parts.find((p) => p.type === "month")?.value ?? String(date.getMonth() + 1).padStart(2, "0");
  const day = parts.find((p) => p.type === "day")?.value ?? String(date.getDate()).padStart(2, "0");

  const yearBE = (yearAD + 543) % 100;
  return `${String(yearBE).padStart(2, "0")}${month}${day}`;
}

/**
 * Given existing document codes/strings that may match `XXX-YYMMDD-NNN` or `YYMMDD-NNN`,
 * returns the next sequential code `XXX-YYMMDD-NNN` for the current Thai date.
 */
export function nextDailySeqNumber(
  existingCodes: string[],
  docPrefix: string,
  date: Date = new Date()
): string {
  const datePart = getThaiDatePrefix(date);
  const cleanPrefix = docPrefix.toUpperCase().slice(0, 3);
  const regex = new RegExp(`(?:^|\\[)(?:${cleanPrefix}-?)?${datePart}-(\\d{3,})(?:\\]|$)`);

  let maxSeq = 0;
  for (const code of existingCodes) {
    const match = code.match(regex);
    if (match) {
      const seq = Number.parseInt(match[1], 10);
      if (!Number.isNaN(seq) && seq > maxSeq) {
        maxSeq = seq;
      }
    }
  }

  return `${cleanPrefix}${datePart}-${String(maxSeq + 1).padStart(3, "0")}`;
}
