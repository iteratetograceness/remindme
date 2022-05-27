import { WebClient } from '@slack/web-api'

const scheduleMessages = async (
  id: string,
  message: string,
  dateArray: number[],
  token: string,
  client: WebClient
): Promise<string[][]> => {
  const messageIds: string[][] = []
  for (const date of dateArray) {
    try {
      const response = await client.chat.scheduleMessage({
        channel: id,
        text: message,
        post_at: date,
        token,
      })
      if (response.scheduled_message_id) messageIds.push([response.scheduled_message_id, id])
    } catch (error) {
      console.error('> Ran into error scheduling message for', date, JSON.stringify(error))
    }
  }
  return messageIds
}

export default scheduleMessages
