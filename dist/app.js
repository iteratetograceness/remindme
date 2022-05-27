"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bolt_1 = require("@slack/bolt");
const utils_1 = require("./utils");
const createSchedulerView_1 = __importDefault(require("./utils/createSchedulerView"));
// import { v4 as uuid } from 'uuid'
// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();
const PORT = 5000;
const app = new bolt_1.App({
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    clientId: process.env.SLACK_CLIENT_ID,
    clientSecret: process.env.SLACK_CLIENT_SECRET,
    stateSecret: 'remind-me-secret',
    scopes: ['chat:write', 'commands', 'chat:write.public'],
    port: PORT,
    logLevel: bolt_1.LogLevel.DEBUG,
    // customRoutes: generateCustomRoutes(),
    installationStore: (0, utils_1.createInstallationStore)(),
    installerOptions: {
        redirectUriPath: '/slack/redirect',
    },
});
/**
 * Opens modal to gather user information for scheduling messages
 */
app.command('/schedule', async ({ ack, body, context, logger, client }) => {
    await ack();
    try {
        await client.views.open({
            token: context.botToken,
            trigger_id: body.trigger_id,
            view: (0, createSchedulerView_1.default)(),
        });
    }
    catch (error) {
        logger.error(error);
    }
});
app.action('users_select-action', async ({ ack }) => await ack());
app.view('schedule', async ({ ack, body, view, client, logger }) => {
    await ack();
    const submission = view.state.values;
    const message = submission.message.ml_input.value;
    const recipient = submission.recipient['users_select-action']['selected_user'];
    const time = submission.time['timepicker-action']['selected_time'];
    const timezone = submission.timezone['static_select-action']['selected_option']
        ? submission.timezone['static_select-action']['selected_option']['value']
        : 'America/New_York';
    const start = submission['start']['datepicker-action']['selected_date'];
    const end = submission['end']['datepicker-action']['selected_date'];
    const user = body['user']['id'];
    logger.info('>> response: ', message, recipient, time, timezone, start, end);
    if (start && end && time)
        (0, utils_1.generateDates)(start, end, time, timezone);
    // schedule messages
    // if successful, send "messages scheduled!"
    // else send "sorry i'm struggling, try again later."
    try {
        await client.chat.postMessage({
            channel: user,
            text: 'ok gud.',
        });
    }
    catch (error) {
        logger.error(error);
    }
});
(async () => {
    await app.start(process.env.PORT || 3000);
    console.log('⚡️ Bolt app is running!');
})();
