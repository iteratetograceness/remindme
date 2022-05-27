import { DateTime } from 'luxon';
const generateDates = (start, end, time, timezone) => {
    const dates = [];
    const startISO = start + 'T' + time;
    const endISO = end + 'T' + time;
    const startUNIX = DateTime.fromISO(startISO, { zone: timezone });
    const endUNIX = DateTime.fromISO(endISO, { zone: timezone });
    let cursor = startUNIX;
    while (cursor.ts <= endUNIX.ts) {
        console.log(cursor);
        dates.push(cursor.toUnixInteger());
        // toSeconds.push(cursor.toUnixInteger())
        cursor = cursor.plus({ days: 1 });
    }
    return dates;
};
console.log(generateDates('2022-05-27', '2022-05-29', '18:50', 'America/New_York'));
export default generateDates;
