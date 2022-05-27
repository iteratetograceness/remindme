import { DateTime } from 'luxon'

/**
 * Generates array of UTC Epoch format dates between 2 dates, inclusive
 */

interface IDateTIme extends DateTime {
  ts: number
}

const generateDates = (start: string, end: string, time: string, timezone: string) => {
  const dates = []
  // 17:43 America/New_York 2022-05-27 2022-05-28
  const startISO = start + 'T' + time
  const endISO = end + 'T' + time
  const startUNIX = DateTime.fromISO(startISO).setZone(timezone) as IDateTIme
  const endUNIX = DateTime.fromISO(endISO).setZone(timezone) as IDateTIme

  if (startUNIX === endUNIX) return [startUNIX.ts]

  let cursor = startUNIX
  while (cursor.ts <= endUNIX.ts) {
    dates.push(cursor.ts)
    cursor = cursor.plus({ days: 1 }) as IDateTIme
  }

  return dates
}

export default generateDates
