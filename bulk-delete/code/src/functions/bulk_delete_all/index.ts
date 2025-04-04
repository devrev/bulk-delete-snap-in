import { betaSDK, client } from '@devrev/typescript-sdk';

import { delete_accounts } from '../bulk_delete/accounts_delete';
import { delete_contacts } from '../bulk_delete/contacts_delete';
import { delete_works } from '../bulk_delete/works_delete';
import { issueWarning } from '../issue_warning/index';
import { filteredTagNames, globals, hasAccess, scheduleEvent, updateSnapIn } from '../utils/devUtils';

export async function handleEvent(event: any): Promise<void> {
  try {
    const apiBase = globals(event).devrev_apiBase;
    const devrevPAT = globals(event).devrev_pat;
    const devrevSDK = client.setupBeta({
      endpoint: apiBase,
      token: devrevPAT,
    });
    const userID = globals(event).userID;
    const validation_status = globals(event).radioButtonValue || globals(event).stored_object;
    const eventType = globals(event).event_type;
    const snapinId = globals(event).snap_in_id;
    const source_id = globals(event).source_id;
    const object_type = globals(event).radioButtonValue;
    const objectType = globals(event).stored_object;
    const validation = globals(event).validation;

    // For the first run, it will create a warning message
    if (globals(event).timeline_id && validation_status != 'No' && validation_status != 'Yes') {
      const isAdmin = await hasAccess(userID, devrevSDK, globals(event).group_id);
      console.log('isAdmin:', isAdmin);
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
      try {
        const bodyMessage = `Please note: \n 1. All the tagged items will be deleted permanently. \n 2. Deleted items cannot be recovered. \n 3. If items were imported via an active Airdrop sync, the deletion will cause the sync to fail. \n 4. Please confirm if you would like to proceed in the next step.`;
        await devrevSDK.timelineEntriesCreate({
          body: bodyMessage,
          body_type: betaSDK.TimelineCommentBodyType.Text,
          expires_at: new Date(new Date().getTime() + 5 * 20 * 1000).toJSON(),
          object: snapinId,
          private_to: [userID],
          type: betaSDK.TimelineEntriesCreateRequestType.TimelineComment,
          visibility: betaSDK.TimelineEntryVisibility.Private,
        });
      } catch (error) {
        console.error('Error creating timeline entry:', error);
        return;
      }

      await devrevSDK.timelineEntriesDelete({ id: globals(event).timeline_id });
      const newPayload = {
        ...globals(event).event?.payload,
        failed_count: 0,
      };
      const body = {
        event_type: eventType,
        id: source_id,
        payload: Buffer.from(JSON.stringify(newPayload)).toString('base64'),
        publish_at: new Date(Date.now() + 20000).toISOString(),
      };
      const snapinUpdateResponse = await updateSnapIn(devrevSDK, snapinId, object_type, 0, 'Not Set');

      // Schedule the next event to pass the payload to the next function
      if (snapinUpdateResponse) {
        await scheduleEvent(devrevSDK, body);
        return;
      }
      return;
    }

    // Issues warning if the validation_status is not set
    if (validation === 'Not Set' && validation_status !== 'No' && validation_status !== 'Yes') {
      await issueWarning(event);
      return;
    }

    // Check if timeline_id exists and validation_status is set
    if (globals(event).timeline_id && validation_status) {
      await devrevSDK.timelineEntriesDelete({ id: globals(event).timeline_id });

      if (validation_status === 'No') {
        return; // Delete operation cancelled
      }

      const tags = await filteredTagNames(event, devrevSDK);
      const joinedTags = tags.join(', ');
      const bodyMessage = `<${userID}> is deleting all ${objectType} tagged with ${joinedTags}.`;

      // Create a timeline entry to notify the user
      const timelineNotifierPayload: betaSDK.TimelineEntriesCreateRequest = {
        body: bodyMessage,
        body_type: betaSDK.TimelineCommentBodyType.Text,
        object: globals(event).snap_in_id,
        type: betaSDK.TimelineEntriesCreateRequestType.TimelineComment,
        visibility: betaSDK.TimelineEntryVisibility.Public,
      };

      try {
        await devrevSDK.timelineEntriesCreate(timelineNotifierPayload);
      } catch (error) {
        console.error('Error creating timeline entry:', error);
      }
    }
    // Handle deletion based on the object type
    switch (true) {
      case objectType === 'Tickets' || objectType === 'Issues' || objectType === 'Opportunities':
        await delete_works(globals(event), devrevSDK, objectType);
        break;
      case objectType === 'Accounts':
        await delete_accounts(globals(event), devrevSDK);
        break;
      case objectType === 'Contacts':
        await delete_contacts(globals(event), devrevSDK);
        break;
      default:
        return;
    }
  } catch (error) {
    console.error('Error handling event:', error);
  }
}

export const run = async (events: any[]): Promise<void> => {
  for (const event of events) {
    await handleEvent(event);
  }
};

export default run;
