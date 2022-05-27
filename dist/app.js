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
import { createInstallationStore, generateDates, createSchedulerView, deleteScheduledMessages } from './utils/index.js';
import env from 'dotenv';
import scheduleMessages from './utils/scheduleMessages.js';
import { v4 as uuid } from 'uuid';
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
app.view('schedule', ({ ack, body, view, context, client, logger }) => __awaiter(void 0, void 0, void 0, function* () {
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
    let dates = [];
    let messageIds = [];
    logger.info('>> response: ', message, recipient, time, timezone, start, end);
    if (start && end && time)
        dates = generateDates(start, end, time, timezone);
    if (recipient && message && dates && context.botToken) {
        messageIds = yield scheduleMessages(recipient, message, dates, context.botToken, client);
    }
    let msg = '';
    if (messageIds.length > 0) {
        const ID = uuid();
        cache.set(ID, messageIds);
        msg = `Messages scheduled. Keep this ID in case you regret sending '${message}': ${ID}.`;
    }
    else
        msg = 'Something went wrong. Try again later.';
    try {
        yield client.chat.postMessage({
            channel: user,
            text: msg,
        });
    }
    catch (error) {
        logger.error(error);
    }
}));
/**
 * Cancel scheduled messages
 * Parameters: ID
 */
app.command('/cancel', ({ payload, context, ack, respond, client }) => __awaiter(void 0, void 0, void 0, function* () {
    yield ack();
    const { text } = payload;
    const ID = text.trim();
    const messageIds = cache.get(ID) || [];
    if (!messageIds.length) {
        yield respond("Um, that ID doesn't exist.");
        return;
    }
    yield deleteScheduledMessages(messageIds, context.botToken || '', client);
    yield respond('Messages unscheduled.');
}));
(() => __awaiter(void 0, void 0, void 0, function* () {
    yield app.start(process.env.PORT || 3000);
    console.log('⚡️ Bolt app is running!');
}))();
