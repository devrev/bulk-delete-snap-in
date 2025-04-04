import { betaSDK, client } from '@devrev/typescript-sdk';

import { filteredTagNames, globals, hasAccess } from '../utils/devUtils';

export async function issueWarning(event: any) {
  const apiBase = globals(event).devrev_apiBase;
  const devrevPAT = globals(event).devrev_pat;
  const objectType = globals(event).stored_object;

  const devrevSDK = client.setupBeta({
    endpoint: apiBase,
    token: devrevPAT,
  });

  const snapinId = globals(event).snap_in_id;

  // Check if the user is an admin
  const userID = globals(event).userID;
  if (globals(event).timeline_id) {
    await devrevSDK.timelineEntriesDelete({ id: globals(event).timeline_id });

    // Check if the user is an admin
    const isAdmin = await hasAccess(userID, devrevSDK, globals(event).group_id);
    if (!isAdmin) {
      try {
        await devrevSDK.timelineEntriesCreate({
          body: `You are not authorized to delete.`,
          body_type: betaSDK.TimelineCommentBodyType.Text,
          expires_at: new Date(new Date().getTime() + 5 * 60 * 1000).toJSON(),
          object: globals(event).snap_in_id,
          private_to: [userID],
          type: betaSDK.TimelineEntriesCreateRequestType.TimelineComment,
          visibility: betaSDK.TimelineEntryVisibility.Private,
        });
        return;
      } catch (error) {
        console.error('Error creating timeline entry:', error);
        return;
      }
    }
  }

  const tagsResponse = await filteredTagNames(event, devrevSDK);
  const snapinMessage = `Note: Confirm that you are about to delete ${objectType} that have the tag ${tagsResponse.join(
    ', '
  )}:`;

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
                          text: 'Select Yes to proceed',
                          type: 'plain_text',
                        },
                        text: {
                          text: 'Yes',
                          type: 'plain_text',
                        },
                        value: 'Yes',
                      },
                      {
                        description: {
                          text: 'Select No to cancel',
                          type: 'plain_text',
                        },
                        text: {
                          text: 'No',
                          type: 'plain_text',
                        },
                        value: 'No',
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
      expires_at: new Date(new Date().getTime() + 5 * 60 * 1000).toJSON(),
      labels: [betaSDK.TimelineEntriesCollection.Discussions],
      object: snapinId,
      snap_kit_body: snapkitBody,
      type: betaSDK.TimelineEntriesCreateRequestType.TimelineComment,
      visibility: betaSDK.TimelineEntryVisibility.Internal,
    });
  } catch (e) {
    console.error(`This is the error`, e);
  }
}
