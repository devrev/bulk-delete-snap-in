# Bulk Delete Data Snap-In
**DISCLAIMER** 
This action is irreversible—please proceed with this automation only with the utmost caution.

## Overview

The Bulk Delete Data Snap-In allows users to delete large volumes of Tickets, Issues, Accounts, or Contacts with a single command. It is designed for efficiency and reliability, providing a streamlined process for data cleanup.

## How the Snap-In Works

1. **Command-Based Execution**:  
   Triggered using the `bulk_delete` command in the timeline, specifying the type of data to delete (e.g., `Tickets`, `Issues`, etc.).

2. **Tag-Based Filtering**:  
   Data to be deleted is filtered using tags specified during the configuration.

3. **Parallel Deletion**:  
   Items are deleted concurrently using `Promise.allSettled` for efficient execution.

4. **Error Handling**:  
   Any failed deletions are logged, and summaries are provided for user review.

5. **Feedback and Updates**:  
   Status updates are added as timeline comments, ensuring users can track the deletion progress.

## How to Use

1. **Installing the Snap-In**:

   - Go to the DevRev marketplace and install the **Bulk Delete Data** snap-in.

2. **Configure the Snap-In**:

   - Specify the tags to filter data.
   - Specify which group of users has access

3. **Execute the Command**:

   - Use the command `bulk_delete <data_type>` (e.g., `bulk_delete Tickets`) in the timeline to trigger the process.

4. **Select the Object type**:

   - Select the data type you want to delete and make sure the tags displayed are the tags of the data that you wish to delete displayed in the timeline.

5. **Review Results**:

   - Check the timeline for comments summarizing the deletion status, including any errors or skipped items.

6. **Repeat if Needed**:

   - For large volumes (e.g., Accounts), rerun the command if some items were not deleted.

7. **Constraints**:
   - In the case of accounts, the accounts linked to a ticket cannot be deleted through the command unless all the tickets linked to it are unlinked.
