import { betaSDK } from '@devrev/typescript-sdk';

import { scheduleEvent, updateSnapIn } from '../utils/devUtils';

export async function delete_contacts(globals: any, devrevSDK: betaSDK.Api<unknown>) {
  let cursor: string | undefined = undefined;
  let failedCount = 0; // Track failed deletions
  const eventType = globals.event_type;
  const snapinId = globals.snap_in_id;
  const source_id = globals.source_id;
  const objectType = globals.object_type;
  const limit = globals.limit;

  try {
    // Fetch contacts with pagination
    const response = await devrevSDK.revUsersList({
      cursor,
      limit: limit,
      tags: globals.tags,
    });

    const responseData: betaSDK.RevUsersListResponse = response.data;

    if (!responseData.rev_users || responseData.rev_users.length === 0) {
      return; // Exit if no contacts to process
    }

    const allContacts = responseData.rev_users;
    cursor = responseData.next_cursor;

    // Process deletions in parallel
    const deleteResults = await Promise.allSettled(
      allContacts.map((contact) => devrevSDK.revUsersDelete({ id: contact.id }))
    );

    // Log failed deletions
    deleteResults.forEach((result) => {
      if (result.status === 'rejected') {
        failedCount++;
        console.error(`Failed to delete contact: ${result.reason?.message || 'Unknown error'}`);
      }
    });

    // Schedule next event if more contacts remain
    if (cursor) {
      const newPayload = {
        ...globals.event?.payload,
        failed_count: failedCount,
      };

      const body = {
        event_type: eventType,
        id: source_id,
        payload: Buffer.from(JSON.stringify(newPayload)).toString('base64'),
        publish_at: new Date(Date.now() + 5000).toISOString(), // Schedule 5 seconds later
      };

      const snapinUpdateResponse = await updateSnapIn(devrevSDK, snapinId, objectType, failedCount, 'None');

      if (snapinUpdateResponse) {
        await scheduleEvent(devrevSDK, body);
      }
    } else {
      // All contacts processed; prepare summary message
      const remainingResponse = await devrevSDK.revUsersList({
        limit: 1,
        tags: globals.tags,
      });

      const remainingContacts = remainingResponse.data.rev_users.length;

      const bodyMessage =
        remainingContacts > 0 ? 'Failed to delete all contacts.' : 'Successfully deleted all contacts.';

      await devrevSDK.timelineEntriesCreate({
        body: bodyMessage,
        object: snapinId,
        type: betaSDK.TimelineEntriesCreateRequestType.TimelineComment,
        visibility: betaSDK.TimelineEntryVisibility.Internal,
      });
    }
  } catch (error: any) {
    console.error('Error during contact deletion process:', error.response?.data || error.message);
  }
}
