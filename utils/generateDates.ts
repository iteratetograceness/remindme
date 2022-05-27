import { DateTime } from "luxon";

/**
 * Generates array of UTC Epoch format dates between 2 dates, inclusive
 */

const generateDates = (
	start: string,
	end: string,
	time: string,
	timezone: string
) => {
	const dates = [];

	const startISO = start + "T" + time;
	const endISO = end + "T" + time;
	const startUNIX = DateTime.fromISO(startISO).setZone(timezone);
	const endUNIX = DateTime.fromISO(endISO).setZone(timezone);

	let cursor = startUNIX;
	while (cursor.toSeconds() <= endUNIX.toSeconds()) {
		dates.push(cursor.toSeconds());
		cursor = cursor.plus({ days: 1 });
	}

	return dates;
};

export default generateDates;
