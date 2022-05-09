const { App } = require('@slack/bolt');
const { Pool } = require('pg');

const databaseConfig = { connectionString: process.env.CONNECTION_STRING };
const pool = new Pool(databaseConfig);

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
        console.log(installation);
        if (installation.isEnterpriseInstall && installation.enterprise !== undefined) { 
            const response = await pool.query(`INSERT INTO installationstore (id, install) VALUES (${installation.enterprise.id}, ${JSON.stringify(installation)})`);
            console.log('> Store installation done.');
            return response;
        }
        if (installation.team !== undefined) { 
            const response = await pool.query(`INSERT INTO installationstore (id, install) VALUES (${installation.team.id}, ${JSON.stringify(installation)})`);
            console.log('> Store installation done.');
            return response;
        }
        throw new Error('Failed saving installation data to installationStore');
      },
      fetchInstallation: async () => {
        if (installQuery.isEnterpriseInstall && installQuery.enterpriseId !== undefined) {
            const response =  await pool.query(`SELECT install FROM installationstore WHERE id=${installQuery.enterpriseId})`);
            return response.json();
        }
        if (installQuery.teamId !== undefined) {
            const response = await pool.query(`SELECT install FROM installationstore WHERE id=${installQuery.teamId})`);
            return response.json();
        }
        throw new Error('Failed fetching installation');
      },
      deleteInstallation: async () => {
        if (installQuery.isEnterpriseInstall && installQuery.enterpriseId !== undefined) {
            return await pool.query(`DELETE FROM installationstore WHERE id=${installQuery.enterpriseId})`);
        }
        if (installQuery.teamId !== undefined) {
            return await pool.query(`DELETE FROM installationstore WHERE id=${installQuery.teamId})`);
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
    endDate.setHours(15, 30, 0);
    const endDateString = endDate.toUTCString();

    while (dateString !== endDateString) {
        date.setDate(date.getDate() + 1); // increment the day
        date.setHours(15, 30, 0); // set hours to be 9am
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
