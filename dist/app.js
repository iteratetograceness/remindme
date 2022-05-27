var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import pkg from '@slack/bolt';
const { App, LogLevel } = pkg;
import NodeCache from 'node-cache';
import { createInstallationStore, generateDates, createSchedulerView } from './utils/index.js';
import env from 'dotenv';
// import { v4 as uuid } from 'uuid'
// eslint-disable-next-line @typescript-eslint/no-var-requires
env.config();
const PORT = 5000;
const cache = new NodeCache();
const app = new App({
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    clientId: process.env.SLACK_CLIENT_ID,
    clientSecret: process.env.SLACK_CLIENT_SECRET,
    stateSecret: 'remind-me-secret',
    scopes: ['chat:write', 'commands', 'chat:write.public'],
    port: PORT,
    logLevel: LogLevel.DEBUG,
    // customRoutes: generateCustomRoutes(),
    installationStore: createInstallationStore(cache),
    installerOptions: {
        redirectUriPath: '/slack/redirect',
    },
});
/**
 * Opens modal to gather user information for scheduling messages
 */
app.command('/schedule', ({ ack, body, context, logger, client }) => __awaiter(void 0, void 0, void 0, function* () {
    yield ack();
    try {
        yield client.views.open({
            token: context.botToken,
            trigger_id: body.trigger_id,
            view: createSchedulerView(),
        });
    }
    catch (error) {
        logger.error(error);
    }
}));
app.action('users_select-action', ({ ack }) => __awaiter(void 0, void 0, void 0, function* () { return yield ack(); }));
app.action('static_select-action', ({ ack }) => __awaiter(void 0, void 0, void 0, function* () { return yield ack(); }));
app.view('schedule', ({ ack, body, view, client, logger }) => __awaiter(void 0, void 0, void 0, function* () {
    yield ack();
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
        generateDates(start, end, time, timezone);
    // schedule messages
    // if successful, send "messages scheduled!"
    // else send "sorry i'm struggling, try again later."
    try {
        yield client.chat.postMessage({
            channel: user,
            text: 'ok gud.',
        });
    }
    catch (error) {
        logger.error(error);
    }
}));
/**
 * Cancel scheduled messages
 * Parameters: referenceId
 */
app.command('/cancel', ({ payload, context, ack, respond }) => __awaiter(void 0, void 0, void 0, function* () {
    yield ack();
    const { text } = payload;
    const messageIds = cache.get(text.trim()) || [[]];
    yield deleteScheduledMessages(messageIds, context.botToken || '');
    yield respond('Messages unscheduled.');
}));
// const scheduleMessages = async (id, message, dateArray, token) => {
//   const messageIds = []
//   for (let date of dateArray) {
//     try {
//       const response = await app.client.chat.scheduleMessage({
//         channel: id,
//         text: message,
//         post_at: date,
//         token,
//       })
//       console.log('> Scheduled messaged: ', date, response)
//       messageIds.push([response.scheduled_message_id, id])
//     } catch (error) {
//       console.error('> Ran into error scheduling message for', date, JSON.stringify(error))
//     }
//   }
//   return messageIds
// }
const deleteScheduledMessages = (messageArray, token) => __awaiter(void 0, void 0, void 0, function* () {
    for (const message of messageArray) {
        try {
            yield app.client.chat.deleteScheduledMessage({
                channel: message[1],
                scheduled_message_id: message[0],
                token,
            });
        }
        catch (error) {
            console.log('> Ran into error while canceling message ID', message[0], error);
        }
    }
});
(() => __awaiter(void 0, void 0, void 0, function* () {
    yield app.start(process.env.PORT || 3000);
    console.log('⚡️ Bolt app is running!');
}))();
