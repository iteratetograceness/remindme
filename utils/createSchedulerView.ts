import { View } from '@slack/bolt'
import { DateTime } from 'luxon/src/datetime'

const createSchedulerView = (): View => {
  return {
    type: 'modal',
    callback_id: 'schedule',
    title: {
      type: 'plain_text',
      text: 'RemindMe',
      emoji: true,
    },
    submit: {
      type: 'plain_text',
      text: 'Submit',
      emoji: true,
    },
    close: {
      type: 'plain_text',
      text: 'Cancel',
      emoji: true,
    },
    blocks: [
      {
        type: 'input',
        block_id: 'message',
        element: {
          type: 'plain_text_input',
          action_id: 'ml_input',
          multiline: true,
          placeholder: {
            type: 'plain_text',
            text: 'Message',
          },
        },
        label: {
          type: 'plain_text',
          text: 'Message',
        },
        hint: {
          type: 'plain_text',
          text: "You should probably keep it short. Don't be a paragraph person.",
        },
      },
      {
        type: 'section',
        block_id: 'recipient',
        text: {
          type: 'mrkdwn',
          text: 'Select a recipient:',
        },
        accessory: {
          type: 'users_select',
          placeholder: {
            type: 'plain_text',
            text: 'Select a user',
            emoji: true,
          },
          action_id: 'users_select-action',
        },
      },
      {
        type: 'input',
        block_id: 'time',
        element: {
          type: 'timepicker',
          initial_time: '13:37',
          placeholder: {
            type: 'plain_text',
            text: 'Select time',
            emoji: true,
          },
          action_id: 'timepicker-action',
        },
        label: {
          type: 'plain_text',
          text: 'Time',
          emoji: true,
        },
      },
      {
        type: 'section',
        block_id: 'timezone',
        text: {
          type: 'mrkdwn',
          text: 'Pick a timezone',
        },
        accessory: {
          type: 'static_select',
          placeholder: {
            type: 'plain_text',
            text: 'Pick a timezone',
            emoji: true,
          },
          options: [
            {
              text: {
                type: 'plain_text',
                text: 'US/Eastern',
                emoji: true,
              },
              value: 'America/New_York',
            },
            {
              text: {
                type: 'plain_text',
                text: 'US/Central',
                emoji: true,
              },
              value: 'America/Chicago',
            },
            {
              text: {
                type: 'plain_text',
                text: 'US/Mountain',
                emoji: true,
              },
              value: 'America/Denver',
            },
            {
              text: {
                type: 'plain_text',
                text: 'US/Pacific',
                emoji: true,
              },
              value: 'America/Los_Angeles',
            },
          ],
          action_id: 'static_select-action',
        },
      },
      {
        type: 'input',
        block_id: 'start',
        element: {
          type: 'datepicker',
          initial_date: DateTime.now().toFormat('yyyy-LL-dd'),
          placeholder: {
            type: 'plain_text',
            text: 'Select a start date',
            emoji: true,
          },
          action_id: 'datepicker-action',
        },
        label: {
          type: 'plain_text',
          text: 'Start Date',
          emoji: true,
        },
      },
      {
        type: 'input',
        block_id: 'end',
        element: {
          type: 'datepicker',
          initial_date: DateTime.now().toFormat('yyyy-LL-dd'),
          placeholder: {
            type: 'plain_text',
            text: 'Select an end date',
            emoji: true,
          },
          action_id: 'datepicker-action',
        },
        label: {
          type: 'plain_text',
          text: 'End Date',
          emoji: true,
        },
      },
    ],
  }
}

export default createSchedulerView
