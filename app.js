const { App } = require('@slack/bolt');

require('dotenv').config();

const PORT = 5000;

const app = new App({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  clientId: process.env.SLACK_CLIENT_ID,
  clientSecret: process.env.SLACK_CLIENT_SECRET,
  stateSecret: 'remind-me-secret',
  scopes: ['chat:write','commands'],
  port: PORT,
  installationStore: {
      storeInstallation: async (installation) => {
        process.env.SLACK_BOT_TOKEN = installation.bot.token;
        process.env.SLACK_INSTALLATION = JSON.stringify(installation);
        return
      },
      fetchInstallation: async (installQuery) => {
        return process.env.SLACK_INSTALLATION
      },
      deleteInstallation: async (installQuery) => {
        process.env.SLACK_INSTALLATION = null
        return
      }
  },
  installerOptions: {
      redirectUriPath: '/slack/redirect',
  }
});

app.command('/reminddan', async ({ command, ack, respond }) => {
    await ack();
    // const dates = generateDates('May 10, 2022','July 30, 2022');
    //await scheduleMessages('U03E7M91A3F', 'Hi Dan, Grace will be OOO on July 29, 2022.', dates);
    const dates = generateDates('May 10, 2022','July 30, 2022');
    await scheduleMessages('U016QLLRG78', 'Hi Dan, Grace will be OOO on July 29, 2022.', dates);
    await respond('Messages scheduled.');
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

    for (let date of dateArray) {

        try {
            const response = await app.client.chat.scheduleMessage({
                channel: userId,
                text: message,
                post_at: date,
                token: process.env.BOT_TOKEN,
            });
            console.log(response)
        } catch (error) {
            console.error('> Ran into error scheduling message for ', date, JSON.stringify(error));
        }
        
    };

    return;

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
