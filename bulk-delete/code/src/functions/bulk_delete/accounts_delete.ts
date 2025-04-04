import { betaSDK } from '@devrev/typescript-sdk';

import { scheduleEvent, updateSnapIn } from '../utils/devUtils';

export async function delete_accounts(globals: any, devrevSDK: betaSDK.Api<unknown>) {
  try {
    let cursor: string | undefined;
    const accountsToDelete: betaSDK.Account[] = [];
    let failedCount = globals.failed_count || 0;
    let totalFailedCount = failedCount;
    const eventType = globals.event_type;
    const snapinId = globals.snap_in_id;
    const source_id = globals.source_id;
    const objectType = globals.object_type;
    const allAccounts: betaSDK.Account[] = [];
    let accountCount = 100;
    const limit = globals.limit;

    // Fetch accounts in batches of 100 based on `failedCount`
    // It will do mock calls to skip the accounts that were already processed
    while (failedCount >= 100) {
      const response = cursor
        ? await devrevSDK.accountsList({ cursor, limit: limit, tags: globals.tags })
        : await devrevSDK.accountsList({ limit: limit, tags: globals.tags });

      const responseData = response.data;
      cursor = responseData.next_cursor;
      failedCount = failedCount - 100;
    }

    // Handle remaining accounts when failedCount is less than 100
    if (failedCount > 0) {
      const response = cursor
        ? await devrevSDK.accountsList({ cursor: cursor, limit: limit, tags: globals.tags })
        : await devrevSDK.accountsList({ limit: limit, tags: globals.tags });

      const responseData = response.data;
      cursor = responseData.next_cursor;
      accountCount = responseData.accounts.length;
      for (let i = failedCount; i < responseData.accounts.length; i++) {
        allAccounts.push(responseData.accounts[i]);
      }
    }
    if (accountCount === 100) {
      const response = cursor
        ? await devrevSDK.accountsList({ cursor, limit: limit, tags: globals.tags })
        : await devrevSDK.accountsList({ limit: limit, tags: globals.tags });
      const responseData = response.data;

      const limiter = limit - allAccounts.length;
      for (let i = 0; i < limiter; i++) {
        allAccounts.push(responseData.accounts[i]); // Ensures only 100 accounts are processed(To avoid rate limit error)
      }
    }

    // Process each account to check if it can be deleted (not linked with a ticket)
    const accountPromises = allAccounts.map(async (account) => {
      try {
        const workspace = await devrevSDK.revOrgsList({ account: [account.id] });
        for (const revOrg of workspace.data.rev_orgs) {
          const linkedTickets = await devrevSDK.worksList({
            limit: 1,
            'ticket.rev_org': [revOrg.id],
            type: [betaSDK.WorkType.Ticket],
          });
          if (linkedTickets.data.works.length === 0) {
            return { account, success: true }; // Mark account as ready for deletion
          } else {
            return { account, reason: 'Linked with a ticket', success: false };
          }
        }
        return { account, reason: 'No rev orgs found', success: false };
      } catch (error: any) {
        console.error(`Error processing account (ID: ${account.id}):`, error.message || error);
        return { account, reason: error.message || error, success: false };
      }
    });

    // Process all accounts concurrently
    const accountResults = await Promise.allSettled(accountPromises);

    // Separate successful and failed accounts
    accountResults.forEach((result) => {
      if (result.status === 'fulfilled' && result.value && result.value.success) {
        accountsToDelete.push(result.value.account);
      } else if (result.status === 'fulfilled' && result.value && !result.value.success) {
        totalFailedCount++;
      } else if (result.status === 'rejected') {
        console.error('Unexpected error during account processing:', result.reason);
      }
    });

    // Attempt to delete all fetched accounts
    const deleteResults = await Promise.allSettled(
      accountsToDelete.map((account) => devrevSDK.accountsDelete({ id: account.id }))
    );

    // Process failed deletions
    deleteResults.forEach((result, index) => {
      if (result.status === 'rejected') {
        const account = accountsToDelete[index];
        totalFailedCount++;
        console.error(`Error deleting account (ID: ${account?.id}):`, result.reason.message);
      }
    });

    // Update the snap-in with the latest count
    const newPayload = {
      ...globals.event?.payload,
      failed_count: totalFailedCount,
    };

    const body = {
      event_type: eventType,
      id: source_id,
      payload: Buffer.from(JSON.stringify(newPayload)).toString('base64'),
      publish_at: new Date(Date.now() + 20000).toISOString(), // Schedule 10 seconds later
    };

    const snapinUpdateResponse = await updateSnapIn(devrevSDK, snapinId, objectType, totalFailedCount, 'None');

    // Schedule the next event if more accounts remain
    if (snapinUpdateResponse && allAccounts.length >= 100) {
      await scheduleEvent(devrevSDK, body);
    } else {
      // Finalize with a timeline comment
      const message =
        totalFailedCount === 0
          ? 'All accounts deleted successfully.'
          : `Failed to delete some accounts (Note: Accounts linked with a ticket cannot be deleted).`;

      await devrevSDK.timelineEntriesCreate({
        body: message,
        object: globals.snap_in_id,
        type: betaSDK.TimelineEntriesCreateRequestType.TimelineComment,
        visibility: betaSDK.TimelineEntryVisibility.Internal,
      });
    }
  } catch (error: any) {
    console.error('Error during account deletion process:', error.message || error);
  }
}
