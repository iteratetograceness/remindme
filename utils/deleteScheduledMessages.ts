import { WebClient } from '@slack/web-api'

const deleteScheduledMessages = async (messageArray: string[][], token: string, client: WebClient) => {
  for (const message of messageArray) {
    try {
      await client.chat.deleteScheduledMessage({
        channel: message[1],
        scheduled_message_id: message[0],
        token,
      })
    } catch (error) {
      console.log('> Ran into error while canceling message ID', message[0], error)
    }
  }
}

export default deleteScheduledMessages
