const { App } = require('@slack/bolt');
const NodeCache = require( "node-cache" );
const { v4: uuid } = require('uuid');

require('dotenv').config();

const PORT = 5000;

const scheduledMessages = new NodeCache();

const app = new App({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  clientId: process.env.SLACK_CLIENT_ID,
  clientSecret: process.env.SLACK_CLIENT_SECRET,
  stateSecret: 'remind-me-secret',
  scopes: ['chat:write','commands'],
  port: PORT,
  customRoutes: [
    {
      path: '/',
      method: ['GET'],
      handler: (_, res) => {
        res.writeHead(200);
        res.end('Homepage');
      },
    },
  ],
  installationStore: {
      storeInstallation: async (installation) => {
        if (installation.isEnterpriseInstall && installation.enterprise !== undefined) { 
            process.env[installation.enterprise.id] =  JSON.stringify(installation)
            return
        }
        if (installation.team !== undefined) { 
            process.env[installation.team.id] =  JSON.stringify(installation)
            return
        }
        throw new Error('Failed saving installation data to installationStore');
      },
      fetchInstallation: async (installQuery) => {
        if (installQuery.isEnterpriseInstall && installQuery.enterpriseId !== undefined) return process.env[installQuery.enterpriseId];
        console.log((process.env[installQuery.teamId]))
        if (installQuery.teamId !== undefined) return process.env[installQuery.teamId];
        throw new Error('Failed fetching installation');
      },
      deleteInstallation: async (installQuery) => {
        if (installQuery.isEnterpriseInstall && installQuery.enterpriseId !== undefined) process.env[installQuery.enterpriseId] = null
        if (installQuery.teamId !== undefined) process.env[installQuery.teamId] = null
        throw new Error('Failed to delete installation');
      }
  },
  installerOptions: {
      redirectUriPath: '/slack/redirect',
  }
});

/**
 * Schedule message to send to certain channel or user from start to end dates
 */
app.command('/reminders', async ({ payload, body, say, respond, ack }) => {
    console.log(payload);
    await ack();
    // const dates = generateDates('May 10, 2022','July 30, 2022');
    // const messageIds = await scheduleMessages('U016QLLRG78', 'Hi Dan, Grace will be OOO on July 29, 2022.', dates);
    const referenceId = uuid();
    // scheduleMessages.set(referenceId, messageIds, 10000); 
    await say(`Niiiiiiiiiiice, messages scheduled. Here is your reference ID: ${referenceId}. You'll need it if you ever want to edit or cancel your scheduled messages.`);
});

app.command('/cancel', async ({ command, ack, respond }) => {
    await ack();
    const messages = await listScheduledMessages();
    await deleteScheduledMessages(messages);
    await respond('Messages unscheduled.');
});

/**
 * Generates array of UTC format dates from today to `lastDay`
 * @param {string} lastDay - Date String
 */
const generateDates = (start, end) => {
    const dates = []
    const date = new Date(start);
    let dateString = '';
    const endDate = new Date(end);
    endDate.setHours(9, 0, 0);
    const endDateString = endDate.toUTCString();

    while (dateString !== endDateString) {
        date.setDate(date.getDate() + 1); // increment the day
        date.setHours(9, 0, 0); // set hours to be 9am
        dateString = date.toUTCString();
        dates.push(new Date(date).getTime() / 1000);
    }
    
    return dates;
}

const scheduleMessages = async (userId, message, dateArray) => {
    const messageIds = []
    for (let date of dateArray) {
        try {
            const response = await app.client.chat.scheduleMessage({
                channel: userId,
                text: message,
                post_at: date,
                token: process.env.BOT_TOKEN,
            });
            messageIds.push(response.scheduled_message_id)
        } catch (error) {
            console.error('> Ran into error scheduling message for ', date, JSON.stringify(error));
        }
    };
    return messageIds;
}

const listScheduledMessages = async () => {
    const messages = [];

    try {
        const response = await app.client.chat.scheduledMessages.list();
        for (let message of response.scheduled_messages) {
            messages.push(message)
        }
    } catch (error) {
        console.log('> Ran into error listing scheduled messages: ', error);
    }

    return messages;
}

const deleteScheduledMessages = async (messageArray) => {
    for (let message of messageArray) {
        try {
            const response = await app.client.chat.deleteScheduledMessage({
                channel: message.channel_id,
                scheduled_message_id: message.id,
                token: process.env.BOT_TOKEN,
            });
            console.log(response);
        } catch (error) {
            console.log('> Ran into error while canceling message ID', message.id, error);
        }
    }
}

(async () => {
    await app.start(process.env.PORT || 3000);
    console.log('⚡️ Bolt app is running!');
})();
