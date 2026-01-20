const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function generateRandomPart(length: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (byte) => CHARS[byte % CHARS.length]).join("");
}

export function generateUID(): string {
  return "XCEM" + generateRandomPart(6);
}


export function generateRandomId(): string {
  return "XCAT" + generateRandomPart(6);
}

export function generateNextEmpId(latestId?: string | null): string {
  // If no latest ID or invalid format, return the provided starting client ID
  if (!latestId || latestId.length !== 10 || !/^XCEM[A-Z0-9]{6}$/.test(latestId)) {
    return "XCEM000001";
  }

  const numericPart = latestId.slice(4); // Extract after HSCL or Any Prefix
  const currentNum = parseInt(numericPart, 36); // Base-36 parse

  if (isNaN(currentNum)) {
    return "XCEM000001";
  }

  const nextNum = currentNum + 1;
  const nextNumericPart = nextNum.toString(36).toUpperCase().padStart(6, "0").slice(-6);

  return "XCEM" + nextNumericPart;
}
