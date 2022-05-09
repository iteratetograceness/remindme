const { App } = require('@slack/bolt');

const database = {};

const databaseProxy = {
    set: async (key, data) => database[key] = data,
    get: async (key) => database[key]
};

require('dotenv').config();

const PORT = 5000;

const app = new App({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
//   token: process.env.SLACK_BOT_TOKEN,
  clientId: process.env.SLACK_CLIENT_ID,
  clientSecret: process.env.SLACK_CLIENT_SECRET,
  stateSecret: 'remind-me-secret',
  scopes: ['chat:write','commands'],
  port: PORT,
  installationStore: {
      storeInstallation: async (installation) => {
        if (installation.isEnterpriseInstall && installation.enterprise !== undefined) { 
            return await databaseProxy.set(installation.enterprise.id, installation);
        }
        if (installation.team !== undefined) { 
            return await databaseProxy.set(installation.team.id, installation);
        }
        throw new Error('Failed saving installation data to installationStore');
      },
      fetchInstallation: async () => {
        if (installQuery.isEnterpriseInstall && installQuery.enterpriseId !== undefined) {
            return await databaseProxy.get(installQuery.enterpriseId);
        }
        if (installQuery.teamId !== undefined) {
            return await databaseProxy.get(installQuery.teamId);
        }
        throw new Error('Failed fetching installation');
      },
      deleteInstallation: async () => {
        if (installQuery.isEnterpriseInstall && installQuery.enterpriseId !== undefined) {
            return await database.delete(installQuery.enterpriseId);
        }
        if (installQuery.teamId !== undefined) {
            return await database.delete(installQuery.teamId);
        }
        throw new Error('Failed to delete installation');
      }
  },
  installerOptions: {
      redirectUriPath: '/slack/redirect',
  }
});

app.command('/reminddan', async ({ command, ack, response }) => {
    await ack();
    // const dates = generateDates('May 10, 2022','July 30, 2022');
    //await scheduleMessages('U03E7M91A3F', 'Hi Dan, Grace will be OOO on July 29, 2022.', dates);
    const dates = generateDates('May 9, 2022','May 10, 2022');
    await scheduleMessages('U03EKNARR8V', 'Hi Dan, Grace will be OOO on July 29, 2022.', dates);
    await response('Messages scheduled.');
});

app.command('/cancel', async ({ command, ack, response }) => {
    await ack();
    const messages = await listScheduledMessages();
    await deleteScheduledMessages(messages);
    await response('Messages unscheduled.');
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
    endDate.setHours(3, 10, 0);
    const endDateString = endDate.toUTCString();

    while (dateString !== endDateString) {
        date.setDate(date.getDate() + 1); // increment the day
        date.setHours(3, 10, 0); // set hours to be 9am
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
                scheduled_message_id: message.id
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
