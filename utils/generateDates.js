"use strict";
exports.__esModule = true;
var luxon_1 = require("luxon");
var generateDates = function (start, end, time, timezone) {
    var dates = [];
    var startISO = start + 'T' + time;
    var endISO = end + 'T' + time;
    var startUNIX = luxon_1.DateTime.fromISO(startISO).setZone(timezone);
    var endUNIX = luxon_1.DateTime.fromISO(endISO).setZone(timezone);
    if (startUNIX === endUNIX)
        return [startUNIX.ts];
    var cursor = startUNIX;
    while (cursor.ts <= endUNIX.ts) {
        dates.push(cursor.ts);
        cursor = cursor.plus({ days: 1 });
    }
    return dates;
};
exports["default"] = generateDates;
// 17:43 America/New_York 2022-05-27 2022-05-28
console.log(generateDates('2022-05-27', '2022-05-28', '17:43', 'America/New_York'));
