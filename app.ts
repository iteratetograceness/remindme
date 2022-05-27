import pkg from '@slack/bolt'
const { App, LogLevel } = pkg
import NodeCache from 'node-cache'
import { createInstallationStore, generateDates, createSchedulerView, deleteScheduledMessages } from './utils/index.js'
import env from 'dotenv'
import scheduleMessages from './utils/scheduleMessages.js'
import { v4 as uuid } from 'uuid'

// eslint-disable-next-line @typescript-eslint/no-var-requires
env.config()

const PORT = 5000
const cache = new NodeCache()

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
})

/**
 * Opens modal to gather user information for scheduling messages
 */

app.command('/schedule', async ({ ack, body, context, logger, client }) => {
  await ack()

  try {
    await client.views.open({
      token: context.botToken,
      trigger_id: body.trigger_id,
      view: createSchedulerView(),
    })
  } catch (error) {
    logger.error(error)
  }
})

app.action('users_select-action', async ({ ack }) => await ack())

app.action('static_select-action', async ({ ack }) => await ack())

app.view('schedule', async ({ ack, body, view, context, client, logger }) => {
  await ack()

  const submission = view.state.values
  const message = submission.message.ml_input.value
  const recipient = submission.recipient['users_select-action']['selected_user']
  const time = submission.time['timepicker-action']['selected_time']
  const timezone = submission.timezone['static_select-action']['selected_option']
    ? submission.timezone['static_select-action']['selected_option']['value']
    : 'America/New_York'
  const start = submission['start']['datepicker-action']['selected_date']
  const end = submission['end']['datepicker-action']['selected_date']

  const user = body['user']['id']
  let dates: number[] = []
  let messageIds: string[][] = []

  logger.info('>> response: ', message, recipient, time, timezone, start, end)

  if (start && end && time) dates = generateDates(start, end, time, timezone)

  if (recipient && message && dates && context.botToken) {
    messageIds = await scheduleMessages(recipient, message, dates, context.botToken, client)
  }

  let msg = ''

  if (messageIds.length > 0) {
    const ID = uuid()
    cache.set(ID, messageIds)
    msg = `Messages scheduled. Keep this ID in case you regret sending '${message}': ${ID}.`
  } else msg = 'Something went wrong. Try again later.'

  try {
    await client.chat.postMessage({
      channel: user,
      text: msg,
    })
  } catch (error) {
    logger.error(error)
  }
})

/**
 * Cancel scheduled messages
 * Parameters: ID
 */
app.command('/cancel', async ({ payload, context, ack, respond, client }) => {
  await ack()
  const { text } = payload
  const ID = text.trim()
  const messageIds: string[][] = cache.get(ID) || []

  if (!messageIds.length) {
    await respond("Um, that ID doesn't exist.")
    return
  }

  await deleteScheduledMessages(messageIds, context.botToken || '', client)
  await respond('Messages unscheduled.')
})
;(async () => {
  await app.start(process.env.PORT || 3000)
  console.log('⚡️ Bolt app is running!')
})()
