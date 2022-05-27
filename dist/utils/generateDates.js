"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const luxon_1 = require("luxon");
/**
 * Generates array of UTC Epoch format dates between 2 dates, inclusive
 */
const generateDates = (start, end, time, timezone) => {
    const dates = [];
    const startISO = start + "T" + time;
    const endISO = end + "T" + time;
    const startUNIX = luxon_1.DateTime.fromISO(startISO).setZone(timezone);
    const endUNIX = luxon_1.DateTime.fromISO(endISO).setZone(timezone);
    let cursor = startUNIX;
    while (cursor.toSeconds() <= endUNIX.toSeconds()) {
        dates.push(cursor.toSeconds());
        cursor = cursor.plus({ days: 1 });
    }
    return dates;
};
exports.default = generateDates;
