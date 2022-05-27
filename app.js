const { App, LogLevel } = require("@slack/bolt");
const NodeCache = require("node-cache");
const { DateTime } = require("luxon");
const { v4: uuid } = require("uuid");

require("dotenv").config();

const PORT = 5000;

const cache = new NodeCache();

const app = new App({
	signingSecret: process.env.SLACK_SIGNING_SECRET,
	clientId: process.env.SLACK_CLIENT_ID,
	clientSecret: process.env.SLACK_CLIENT_SECRET,
	stateSecret: "remind-me-secret",
	scopes: ["chat:write", "commands", "chat:write.public"],
	port: PORT,
	logLevel: LogLevel.DEBUG,
	customRoutes: [
		{
			path: "/",
			method: ["GET"],
			handler: (_, res) => {
				res.writeHead(200);
				res.end("Welcome to the homepage of the remindme Slack bot.");
			},
		},
		{
			path: "/support",
			method: ["GET"],
			handler: (_, res) => {
				res.writeHead(200);
				res.end("For support, please email graceyunn@gmail.com.");
			},
		},
		{
			path: "/privacy",
			method: ["GET"],
			handler: (_, res) => {
				res.writeHead(200);
				res.end(
					`This bot requests the following scopes: 'chat:write','commands','chat:write.public'.`
				);
			},
		},
	],
	installationStore: {
		storeInstallation: async (installation) => {
			if (
				installation.isEnterpriseInstall &&
				installation.enterprise !== undefined
			) {
				cache.set(installation.enterprise.id, JSON.stringify(installation));
				return;
			}
			if (installation.team !== undefined) {
				cache.set(installation.team.id, JSON.stringify(installation));
				return;
			}
			throw new Error("Failed saving installation data to installationStore");
		},
		fetchInstallation: async (installQuery) => {
			if (
				installQuery.isEnterpriseInstall &&
				installQuery.enterpriseId !== undefined
			) {
				return JSON.parse(cache.get(installQuery.enterpriseId));
			}
			if (installQuery.teamId !== undefined) {
				return JSON.parse(cache.get(installQuery.teamId));
			}
			throw new Error("Failed fetching installation");
		},
		deleteInstallation: async (installQuery) => {
			if (
				installQuery.isEnterpriseInstall &&
				installQuery.enterpriseId !== undefined
			) {
				process.env[installQuery.enterpriseId] = null;
				cache.del(installQuery.enterpriseId);
				return;
			}
			if (installQuery.teamId !== undefined) {
				process.env[installQuery.teamId] = null;
				cache.del(installQuery.teamId);
			}
			throw new Error("Failed to delete installation");
		},
	},
	installerOptions: {
		redirectUriPath: "/slack/redirect",
	},
});

/**
 * Schedule message to send to certain channel or user from start to end dates
 * Parameters: [@userid/#channel] [start: mm/dd/yyyy] [end: mm/dd/yyyy] [time: hh:mm(am/pm)] [message]
 */
app.command("/schedule", async ({ ack, body, context, logger }) => {
	await ack();

	console.log(DateTime.now().toFormat("yyyy/LL/dd"));

	try {
		const result = await app.client.views.open({
			token: context.botToken,
			trigger_id: body.trigger_id,
			view: {
				type: "modal",
				callback_id: "schedule",
				title: {
					type: "plain_text",
					text: "Remind Me",
					emoji: true,
				},
				submit: {
					type: "plain_text",
					text: "Submit",
					emoji: true,
				},
				close: {
					type: "plain_text",
					text: "Cancel",
					emoji: true,
				},
				blocks: [
					{
						type: "input",
						element: {
							type: "plain_text_input",
							action_id: "ml_input",
							multiline: true,
							placeholder: {
								type: "plain_text",
								text: "What are you trying to send?",
							},
						},
						label: {
							type: "plain_text",
							text: "Message",
						},
						hint: {
							type: "plain_text",
							text: "You should probably keep it short. Don't be a paragraph person.",
						},
					},
					{
						type: "section",
						text: {
							type: "mrkdwn",
							text: "Select a recipient:",
						},
						accessory: {
							type: "users_select",
							placeholder: {
								type: "plain_text",
								text: "Select a user",
								emoji: true,
							},
							action_id: "users_select-action",
						},
					},
					{
						type: "input",
						element: {
							type: "timepicker",
							initial_time: "13:37",
							placeholder: {
								type: "plain_text",
								text: "Select time",
								emoji: true,
							},
							action_id: "timepicker-action",
						},
						label: {
							type: "plain_text",
							text: "Time",
							emoji: true,
						},
					},
					{
						type: "input",
						element: {
							type: "datepicker",
							initial_date: DateTime.now().toFormat("yyyy-LL-dd"),
							placeholder: {
								type: "plain_text",
								text: "Select a start date",
								emoji: true,
							},
							action_id: "datepicker-action",
						},
						label: {
							type: "plain_text",
							text: "Start Date",
							emoji: true,
						},
					},
					{
						type: "input",
						element: {
							type: "datepicker",
							initial_date: DateTime.now().toFormat("yyyy-LL-dd"),
							placeholder: {
								type: "plain_text",
								text: "Select an end date",
								emoji: true,
							},
							action_id: "datepicker-action",
						},
						label: {
							type: "plain_text",
							text: "End Date",
							emoji: true,
						},
					},
				],
			},
		});
		logger.info(">> result: ", result);
	} catch (error) {
		logger.error(error);
	}
});

app.action("users_select-action", async ({ ack, body, logger, client }) => {
	await ack();
});

app.view("schedule", async ({ ack, body, view, client, logger }) => {
	await ack();
	logger.info(">> view obj: ", view.state.values);
});

/**
 * Cancel scheduled messages
 * Parameters: referenceId
 */
app.command("/cancel", async ({ payload, context, ack, respond }) => {
	await ack();
	const { text } = payload;
	const messageIds = cache.get(text.trim());
	await deleteScheduledMessages(messageIds, context.botToken);
	await respond("Messages unscheduled.");
});

/**
 * Generates array of UTC format dates from today to `lastDay`
 * @param {string} lastDay - Date String
 */
const generateDates = (start, end, hours, minutes) => {
	const dates = [];
	const date = new Date(start);

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

const scheduleMessages = async (id, message, dateArray, token) => {
	const messageIds = [];
	for (let date of dateArray) {
		try {
			const response = await app.client.chat.scheduleMessage({
				channel: id,
				text: message,
				post_at: date,
				token,
			});
			console.log("> Scheduled messaged: ", date, response);
			messageIds.push([response.scheduled_message_id, id]);
		} catch (error) {
			console.error(
				"> Ran into error scheduling message for",
				date,
				JSON.stringify(error)
			);
		}
	}
	return messageIds;
};

const deleteScheduledMessages = async (messageArray, token) => {
	for (let message of messageArray) {
		try {
			await app.client.chat.deleteScheduledMessage({
				channel: message[1],
				scheduled_message_id: message[0],
				token,
			});
		} catch (error) {
			console.log(
				"> Ran into error while canceling message ID",
				message.id,
				error
			);
		}
	}
};

(async () => {
	await app.start(process.env.PORT || 3000);
	console.log("⚡️ Bolt app is running!");
})();
