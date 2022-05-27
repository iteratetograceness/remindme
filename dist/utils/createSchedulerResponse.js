import { v1 as uuid } from 'uuid';
const createSchedulerView = (channel, message, start, end, time, timezone, recipient) => {
    if (!message)
        return;
    return {
        channel,
        blocks: [
            {
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: 'Messages scheduled :white_check_mark:',
                },
            },
            {
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: `*:email: Message:* ${message}\n`,
                },
            },
            {
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: `*:date: When:* ${start} - ${end} @ ${time} (${timezone})\n`,
                },
            },
            {
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: `*:arrow_right: Sent to:* ${recipient}\n`,
                },
            },
            {
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: `*:star: ID:* ${uuid()}\n`,
                },
            },
            {
                type: 'divider',
            },
            {
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: 'Make sure to keep your ID safe in case you regret scheduling these messages. You can use `/cancel` to un-schedule them.',
                },
            },
        ],
    };
};
export default createSchedulerView;
