export function calculateNights(checkIn: Date, checkOut: Date): number {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  const diffMs = end.getTime() - start.getTime();
  const nights = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(1, nights);
}

export function calculateUtilityCharge(
  prevReading: number,
  currReading: number,
  ratePerUnit: number,
  minUnits = 0
): { units: number; amount: number } {
  if (currReading < prevReading) {
    throw new Error("เลขมิเตอร์ใหม่ต้องไม่น้อยกว่าเลขมิเตอร์เดิม");
  }
  const rawUnits = Number((currReading - prevReading).toFixed(2));
  const billedUnits = Math.max(rawUnits, minUnits);
  const amount = Number((billedUnits * ratePerUnit).toFixed(2));
  return { units: rawUnits, amount };
}

export function calculateTaxAndService(
  subtotal: number,
  vatRate: number,
  serviceChargeRate: number
): { serviceChargeAmount: number; vatAmount: number; totalAmount: number } {
  const serviceChargeAmount = Number(((subtotal * serviceChargeRate) / 100).toFixed(2));
  const taxable = subtotal + serviceChargeAmount;
  const vatAmount = Number(((taxable * vatRate) / 100).toFixed(2));
  const totalAmount = Number((taxable + vatAmount).toFixed(2));
  return { serviceChargeAmount, vatAmount, totalAmount };
}

export function hasDateOverlap(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date
): boolean {
  return aStart.getTime() < bEnd.getTime() && bStart.getTime() < aEnd.getTime();
}
