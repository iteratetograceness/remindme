const { DateTime } = require("luxon");

// 13:37 2022-05-27 2022-05-27

const start = "2022-05-27";
const end = "2022-05-27";
const time = "13:37";

const generateDates = (start, end, time, timezone) => {
	const dates = [];
	const d1 = DateTime(start);
	const d2 = DateTime(end);

DateTime.setZone("America/Los_Angeles");

	const firstDate = date.setHours(hours, minutes, 0);
	dates.push(Math.floor(new Date(firstDate).getTime() / 1000));

	let dateString = "";
	const endDate = new Date(end);
	endDate.setHours(hours, minutes, 0);
	const endDateString = endDate.toUTCString();

	while (dateString !== endDateString) {
		date.setDate(date.getDate() + 1);
		date.setHours(hours, minutes, 0);
		dateString = date.toUTCString();
		dates.push(Math.floor(new Date(date).getTime() / 1000));
	}

	return dates;
};

generateDates(start, end, time);
