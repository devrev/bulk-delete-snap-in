import { betaSDK } from '@devrev/typescript-sdk';

import { scheduleEvent, updateSnapIn } from '../utils/devUtils';

export async function delete_works(globals: any, devrevSDK: betaSDK.Api<unknown>, objectType: string) {
  let cursor: string | undefined = undefined;
  let workType: betaSDK.WorkType;
  let failedCount = 0;
  const eventType = globals.event_type;
  const snapinId = globals.snap_in_id;
  const source_id = globals.source_id;
  const limit = globals.limit;
  let allWorks: any[] = [];

  // Determine work type based on the objectType parameter
  switch (objectType) {
    case 'Tickets':
      workType = betaSDK.WorkType.Ticket;
      break;
    case 'Issues':
      workType = betaSDK.WorkType.Issue;
      break;
    case 'Opportunities':
      workType = betaSDK.WorkType.Opportunity;
      break;
    default:
      console.error(`Invalid object type: ${objectType}`);
      return;
  }

  try {
    // Fetch works using pagination
    const fetchResponse = await devrevSDK.worksList({
      cursor,
      limit: limit,
      tags: globals.tags,
      type: [workType],
    });

    const responseData: { works: any[]; next_cursor?: string } = fetchResponse.data;

    if (!responseData.works || responseData.works.length === 0) {
      return; // Exit if no works to process
    }

    allWorks = responseData.works;
    cursor = responseData.next_cursor;

    // Delete fetched works in parallel
    const deleteResults = await Promise.allSettled(
      allWorks.map(async (work: any) => {
        try {
          await devrevSDK.worksDelete({ id: work.id });
        } catch (deleteError: any) {
          failedCount++; // Increment count for any deletion failure
          console.error(`Failed to delete ${objectType} with ID ${work.id}:`, deleteError.message);
        }
      })
    );

    // Log failed deletions
    deleteResults.forEach((result) => {
      if (result.status === 'rejected') {
        console.error(`Failed to delete work: ${result.reason?.message || 'Unknown error'}`);
      }
    });

    // Schedule next event if more works remain
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
      // All works processed; prepare summary message
      const remainingResponse = await devrevSDK.worksList({
        limit: 1,
        tags: globals.tags,
        type: [workType],
      });

      const remainingWorks = remainingResponse.data.works.length;

      const bodyMessage =
        remainingWorks > 0 ? `Failed to delete all ${objectType}.` : `Successfully deleted all ${objectType}.`;

      await devrevSDK.timelineEntriesCreate({
        body: bodyMessage,
        object: snapinId,
        type: betaSDK.TimelineEntriesCreateRequestType.TimelineComment,
        visibility: betaSDK.TimelineEntryVisibility.Internal,
      });
    }
  } catch (error: any) {
    console.error(`Error during ${objectType} deletion process:`, error.message);
  }
}
