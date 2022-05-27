import { DateTime } from 'luxon';
const generateDates = (start, end, time, timezone) => {
    const dates = [];
    const startISO = start + 'T' + time;
    const endISO = end + 'T' + time;
    const startUNIX = DateTime.fromISO(startISO, { zone: timezone });
    const endUNIX = DateTime.fromISO(endISO, { zone: timezone });
    let cursor = startUNIX;
    while (cursor.ts <= endUNIX.ts) {
        dates.push(cursor.ts);
        cursor = cursor.plus({ days: 1 });
    }
    return dates;
};
export default generateDates;
// 17:43 America/New_York 2022-05-27 2022-05-28
console.log(generateDates('2022-05-27', '2022-05-29', '18:43', 'America/Los_Angeles'));
