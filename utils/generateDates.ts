import { DateTime } from 'luxon'

/**
 * Generates array of UTC Epoch format dates between 2 dates, inclusive
 */

const generateDates = (start: string, end: string, time: string, timezone: string) => {
  const dates = []
  // 17:43 America/New_York 2022-05-27 2022-05-28
  const startISO = start + 'T' + time
  const endISO = end + 'T' + time
  const startUNIX = DateTime.fromISO(startISO).setZone(timezone)
  const endUNIX = DateTime.fromISO(endISO).setZone(timezone)

  console.log(startUNIX, endUNIX)

  let cursor = startUNIX
  while (cursor.toSeconds() <= endUNIX.toSeconds()) {
    dates.push(cursor.toSeconds())
    cursor = cursor.plus({ days: 1 })
  }

  console.log(dates)

  return dates
}

export default generateDates
