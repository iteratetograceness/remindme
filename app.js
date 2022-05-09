const { App } = require('@slack/bolt');

require('dotenv').config();

const PORT = 5000;

const app = new App({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  token: process.env.SLACK_BOT_TOKEN,
  clientId: process.env.SLACK_CLIENT_ID,
  clientSecret: process.env.SLACK_CLIENT_SECRET,
  stateSecret: 'remind-me-secret',
  scopes: ['chat:write'],
  installationStore: {
      storeInstallation: async (installation) => {
          console.log(installation)
      }
  },
});

app.event('app_home_opened', async ({ event, client, logger }) => {
    try {
      // Call views.publish with the built-in client
      const result = await client.views.publish({
        // Use the user ID associated with the event
        user_id: event.user,
        view: {
          // Home tabs must be enabled in your app configuration page under "App Home"
          "type": "home",
          "blocks": [
            {
              "type": "section",
              "text": {
                "type": "mrkdwn",
                "text": "*Welcome home, <@" + event.user + "> :house:*"
              }
            },
            {
              "type": "section",
              "text": {
                "type": "mrkdwn",
                "text": "Learn how home tabs can be more useful and interactive <https://api.slack.com/surfaces/tabs/using|*in the documentation*>."
              }
            }
          ]
        }
      });
  
      logger.info(result);
    }
    catch (error) {
      logger.error(error);
    }
  });

const startApp = async () => {

    try {
        await app.start(PORT);
        console.log('> App successfully started!')
    } catch (error) {
        console.error('> Ran into error while starting app: ', error);
    }

}

/**
 * Generates array of UTC format dates from today to `lastDay`
 * @param {string} lastDay - Date String
 */
const generateDates = (start, end) => {

    const dates = []
    const date = new Date(start);
    let dateString = '';
    const endDate = new Date(end);
    endDate.setHours(9,0,0);
    const endDateString = endDate.toUTCString();

    while (dateString !== endDateString) {
        date.setDate(date.getDate() + 1); // increment the day
        date.setHours(9,0,0); // set hours to be 9am
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

startApp()
    // .then(() => generateDates('May 10, 2022','July 30, 2022'))
    // .then(dates => scheduleMessages('U03E7M91A3F', 'testing ah', dates))
    // .then(() => listScheduledMessages())
    // .then(() => console.log('> All done!'))
    // .then(messages => deleteScheduledMessages(messages));

    app.listen(PORT, () => {
        console.log(`App listening at http://localhost:${PORT}`)
    })
