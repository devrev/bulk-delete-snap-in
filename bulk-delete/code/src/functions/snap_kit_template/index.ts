import { betaSDK, client } from '@devrev/typescript-sdk';

import { globals, hasAccess } from '../utils/devUtils';

export async function snapKitTemplate(event: any) {
  const apiBase = globals(event).devrev_apiBase;
  const devrevPAT = globals(event).devrev_pat;

  const devrevSDK = client.setupBeta({
    endpoint: apiBase,
    token: devrevPAT,
  });
  // Check if the user is an admin
  const isAdmin = await hasAccess(globals(event).actor_id, devrevSDK, globals(event).group_id);
  if (!isAdmin) {
    try {
      await devrevSDK.timelineEntriesCreate({
        body: `You are not authorized to run this command.`,
        body_type: betaSDK.TimelineCommentBodyType.Text,
        expires_at: new Date(new Date().getTime() + 5 * 60 * 1000).toJSON(),
        object: globals(event).snap_in_id,
        private_to: [globals(event).actor_id],
        type: betaSDK.TimelineEntriesCreateRequestType.TimelineComment,
        visibility: betaSDK.TimelineEntryVisibility.Private,
      });
      return;
    } catch (error) {
      console.error('Error creating timeline entry:', error);
      return;
    }
  }

  const snapinMessage = `Note: Select the type of objects that shall be bulk deleted.`;

  const snapkitBody = {
    body: {
      snaps: [
        {
          elements: [
            {
              action_id: 'user_form',
              action_type: 'remote',
              elements: [
                {
                  element: {
                    action_id: 'radio_buttons',
                    options: [
                      {
                        description: {
                          text: 'Select if you would like to delete Tickets',
                          type: 'plain_text',
                        },
                        text: {
                          text: 'Tickets',
                          type: 'plain_text',
                        },
                        value: 'Tickets',
                      },
                      {
                        description: {
                          text: 'Select if you would like to delete Issues',
                          type: 'plain_text',
                        },
                        text: {
                          text: 'Issues',
                          type: 'plain_text',
                        },
                        value: 'Issues',
                      },
                      {
                        description: {
                          text: 'Select if you would like to delete Accounts',
                          type: 'plain_text',
                        },
                        text: {
                          text: 'Accounts',
                          type: 'plain_text',
                        },
                        value: 'Accounts',
                      },
                      {
                        description: {
                          text: 'Select if you would like to delete Contacts',
                          type: 'plain_text',
                        },
                        text: {
                          text: 'Contacts',
                          type: 'plain_text',
                        },
                        value: 'Contacts',
                      },
                      {
                        description: {
                          text: 'Select if you would like to delete Opportunities',
                          type: 'plain_text',
                        },
                        text: {
                          text: 'Opportunities',
                          type: 'plain_text',
                        },
                        value: 'Opportunities',
                      },
                    ],
                    type: 'radio_buttons',
                  },
                  type: 'input_layout',
                },
              ],
              submit_action: {
                action_id: 'submit',
                style: 'primary',
                text: {
                  text: 'Submit',
                  type: 'plain_text',
                },
                type: 'button',
                value: 'submit',
              },
              type: 'form',
            },
          ],
          title: {
            text: `${snapinMessage}`,
            type: 'plain_text',
          },
          type: 'card',
        },
      ],
    },
    snap_in_action_name: 'bulk_delete_all',
    snap_in_id: globals(event).snap_in_id,
  };

  try {
    await devrevSDK.timelineEntriesCreate({
      body_type: betaSDK.TimelineCommentBodyType.SnapKit,
      expires_at: new Date(new Date().getTime() + 60 * 60 * 1000).toJSON(),
      labels: [betaSDK.TimelineEntriesCollection.Discussions],
      object: globals(event).snap_in_id,
      snap_kit_body: snapkitBody,
      type: betaSDK.TimelineEntriesCreateRequestType.TimelineComment,
      visibility: betaSDK.TimelineEntryVisibility.Internal,
    });
  } catch (e) {
    console.error(`This is the error`, e);
  }
}
export const run = async (events: any[]) => {
  for (const event of events) {
    await snapKitTemplate(event);
  }
};

export default run;
