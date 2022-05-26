const { App, LogLevel } = require('@slack/bolt');
const NodeCache = require( "node-cache" );
const { v4: uuid } = require('uuid');

require('dotenv').config();

const PORT = 5000;

const cache = new NodeCache();

const app = new App({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  clientId: process.env.SLACK_CLIENT_ID,
  clientSecret: process.env.SLACK_CLIENT_SECRET,
  stateSecret: 'remind-me-secret',
  scopes: ['chat:write','commands','chat:write.public'],
  port: PORT,
  logLevel: LogLevel.DEBUG,
  customRoutes: [
    {
      path: '/',
      method: ['GET'],
      handler: (_, res) => {
        res.writeHead(200);
        res.end('Welcome to the homepage of the remindme Slack bot.');
      },
    },
    {
        path: '/support',
        method: ['GET'],
        handler: (_, res) => {
          res.writeHead(200);
          res.end('For support, please email graceyunn@gmail.com.');
        },
      },
      {
        path: '/privacy',
        method: ['GET'],
        handler: (_, res) => {
          res.writeHead(200);
          res.end(`This bot requests the following scopes: 'chat:write','commands','chat:write.public'.`);
        },
      },
  ],
  installationStore: {
      storeInstallation: async (installation) => {
        if (installation.isEnterpriseInstall && installation.enterprise !== undefined) { 
            cache.set(installation.enterprise.id, JSON.stringify(installation))
            // process.env[installation.enterprise.id] =  JSON.stringify(installation)
            return
        }
        if (installation.team !== undefined) { 
            cache.set(installation.team.id, JSON.stringify(installation))
            // process.env[installation.team.id] =  JSON.stringify(installation)
            return
        }
        throw new Error('Failed saving installation data to installationStore');
      },
      fetchInstallation: async (installQuery) => {
        if (installQuery.isEnterpriseInstall && installQuery.enterpriseId !== undefined) {
            return JSON.parse(cache.get(installQuery.enterpriseId));
            //  || process.env[installQuery.enterpriseId];
        }
        if (installQuery.teamId !== undefined) {
            return JSON.parse(cache.get(installQuery.teamId));
            //  || process.env[installQuery.teamId];
        }
        throw new Error('Failed fetching installation');
      },
      deleteInstallation: async (installQuery) => {
        if (installQuery.isEnterpriseInstall && installQuery.enterpriseId !== undefined) {
            process.env[installQuery.enterpriseId] = null
            cache.del(installQuery.enterpriseId)
            return
        }
        if (installQuery.teamId !== undefined) {
            process.env[installQuery.teamId] = null
            cache.del(installQuery.teamId)
        }
        throw new Error('Failed to delete installation');
      }
  },
  installerOptions: {
      redirectUriPath: '/slack/redirect',
  }
});

/**
 * Schedule message to send to certain channel or user from start to end dates
 * Parameters: [@userid/#channel] [start: mm/dd/yyyy] [end: mm/dd/yyyy] [time: hh:mm(am/pm)] [message]
 */
app.command('/reminders', async ({ payload, context, respond, ack }) => {
    await ack();

    const { text } = payload;
    const splitArr = text.split(' ');
    const id = splitArr[0];
    const start = splitArr[1];
    const end = splitArr[2];
    const time = splitArr[3]
    const message = splitArr.slice(4).join(' ');

    // Get user or channel id
    const sanitizedId = id.split('|')[0].match(/[a-zA-Z0-9]+/g).toString();

    // Get hours and minutes
    const splitTime = time.split(':')
    const amOrPm = splitTime[splitTime.length-1].match(/[a-zA-Z]+/g)[0].toLowerCase();
    const hours = (splitTime.length === 2 ? Number(splitTime[0]) : Number(splitTime[0].match(/\d+/g))) + (amOrPm === 'pm' ? 12 : 0);
    const mins = splitTime.length === 2 ? Number(splitTime[1].match(/\d+/g)) : 0;

    // Generate dates
    const dates = generateDates(start, end, hours, mins);

    // Schedule messages and save reference in cache
    const messageIds = await scheduleMessages(sanitizedId, message, dates, context.botToken);
    const referenceId = uuid();
    const TTL = ((new Date(end) + 1) - new Date()) / 1000;
    cache.set(referenceId, messageIds, TTL); 

    // Respond with reference id
    await respond(`Niiiiiiiiiiice, successfully scheduled your message: ${message}. This is your reference ID: ${referenceId}. You'll need it if you ever want to cancel your scheduled messages.`);
});

/**
 * Cancel scheduled messages
 * Parameters: referenceId
 */
app.command('/cancel', async ({ payload, context, ack, respond }) => {
    await ack();
    const { text } = payload;
    const messageIds = cache.get(text.trim())
    console.log(messageIds)
    // await deleteScheduledMessages(messages);
    await respond('Messages unscheduled.');
});

/**
 * Generates array of UTC format dates from today to `lastDay`
 * @param {string} lastDay - Date String
 */
const generateDates = (start, end, hours, minutes) => {
    const dates = []
    const date = new Date(start);
    let dateString = '';
    const endDate = new Date(end);
    endDate.setHours(hours, minutes, 0);
    const endDateString = endDate.toUTCString();

    while (dateString !== endDateString) {
        date.setDate(date.getDate() + 1); 
        date.setHours(hours, minutes, 0); 
        dateString = date.toUTCString();
        dates.push(new Date(date).getTime() / 1000);
    }
    
    return dates;
}

const scheduleMessages = async (userId, message, dateArray, token) => {
    const messageIds = []
    for (let date of dateArray) {
        try {
            const response = await app.client.chat.scheduleMessage({
                channel: userId,
                text: message,
                post_at: date,
                token
            });
            messageIds.push(response.scheduled_message_id)
        } catch (error) {
            console.error('> Ran into error scheduling message for', date, JSON.stringify(error));
        }
    };
    return messageIds;
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
