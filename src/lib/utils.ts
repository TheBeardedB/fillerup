import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Derived fields — single source of truth */
export function calcDerived(
  prevOdometer: number | null,
  odometer: number,
  cost: number,
  gallons: number,
) {
  const dolPerGallon   = gallons > 0 ? cost / gallons : null
  const milesTravelled = prevOdometer != null ? odometer - prevOdometer : null
  const milesPerGallon = milesTravelled != null && gallons > 0
    ? milesTravelled / gallons
    : null
  return { dolPerGallon, milesTravelled, milesPerGallon }
}

export function fmt(n: number | string | null | undefined, decimals = 2) {
  if (n == null || n === '') return '—'
  return Number(n).toFixed(decimals)
}

export function fmtCurrency(n: number | string | null | undefined) {
  if (n == null || n === '') return '—'
  return `$${Number(n).toFixed(2)}`
}
