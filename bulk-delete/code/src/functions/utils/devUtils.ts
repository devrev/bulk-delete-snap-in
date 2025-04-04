import { betaSDK } from '@devrev/typescript-sdk';

export const globals = (event: any) => {
  return {
    actor_id: event?.payload?.actor_id,
    devrev_apiBase: event?.execution_metadata?.devrev_endpoint,
    devrev_pat: event?.context?.secrets?.service_account_token,
    event: event?.payload,
    event_type: 'scheduled_issue_creation',
    failed_count: event?.input_data?.global_values?.failed_count,
    group_id: event?.input_data?.global_values?.access_group,
    limit: 100,
    objectID: event?.payload?.source_id,
    radioButtonValue: event?.payload?.action?.value?.radio_buttons?.value?.value,
    snap_in_id: event?.context?.snap_in_id,
    source_id: event?.input_data?.event_sources?.['scheduled-events'],
    stored_object: event?.input_data?.global_values?.object_type,
    tags: event?.input_data?.global_values?.tags,
    timeline_id: event?.payload?.context?.entry_id,
    userID: event?.context?.user_id,
    validation: event?.input_data?.global_values?.validation,
  };
};

export async function scheduleEvent(
  devrevSDK: betaSDK.Api<unknown>,
  payload: betaSDK.EventSourcesScheduleEventRequest
): Promise<betaSDK.EventSourcesScheduleEventResponse | null> {
  try {
    const response = await devrevSDK.eventSourcesScheduleEvent(payload);
    return response.data;
  } catch (error) {
    console.error('Error scheduling event:', error);
    throw new Error('Error scheduling event');
  }
}

export async function updateSnapIn(
  devrevSDK: betaSDK.Api<unknown>,
  snapinId: string,
  object_type: string,
  failed_count_new: number | null,
  validation: string
) {
  const body = {
    id: snapinId,
    inputs_values: {
      ...(failed_count_new !== null ? { failed_count: failed_count_new } : { failed_count: 0 }),
      object_type: object_type,
      validation: validation,
    },
  };
  try {
    const response = await devrevSDK.snapInsUpdate(body);
    return response.data;
  } catch (error) {
    console.error(`Error updating snap-in:`, error);
    throw new Error('Error updating snap-in');
  }
}

export async function hasAccess(
  devUserId: string,
  devrevSDK: betaSDK.Api<unknown>,
  accessGroupId: string
): Promise<boolean> {
  try {
    if (!accessGroupId) return true;
    const response = await devrevSDK.groupMembersListPost({
      group: accessGroupId,
    });
    return response.data.members.some((memberObject) => memberObject.member.id === devUserId);
  } catch (error) {
    console.error('Error fetching group members:', error);
    return false;
  }
}

export async function filteredTagNames(event: any, devrevSDK: betaSDK.Api<unknown>): Promise<string[]> {
  const tagsResponse = await devrevSDK.tagsList({ limit: 100 });
  const allTags = tagsResponse.data.tags;

  // Use globals(event).tags to filter tags by ID
  const filteredTags = allTags.filter((tag: any) => globals(event).tags.includes(tag.id));

  // Map the filtered tags to their names
  const filteredTagNames = filteredTags.map((tag: any) => tag.name);

  return filteredTagNames;
}
