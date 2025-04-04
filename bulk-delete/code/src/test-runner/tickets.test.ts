import { mockedBetaSDKMethods } from './mocks/typescript-sdk.mock';

describe('Mocked SDK Method Tests', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  // Existing tests for accountsList, accountsDelete, revUsersList, revUsersDelete, worksList, worksDelete

  it('should call worksList for tickets and return a list of tickets', async () => {
    // Mock the response for worksList for tickets
    mockedBetaSDKMethods.worksList.mockResolvedValue({
      data: {
        works: [{ id: 'ticket1', title: 'Ticket 1' }],
      },
    });

    // Call the worksList method for tickets
    const response = await mockedBetaSDKMethods.worksList({ type: ['ticket'] });

    // Verify that worksList was called with the ticket type filter
    expect(mockedBetaSDKMethods.worksList).toHaveBeenCalledWith({ type: ['ticket'] });

    // Check that the response matches the expected mocked data for tickets
    expect(response).toEqual({
      data: {
        works: [{ id: 'ticket1', title: 'Ticket 1' }],
      },
    });
  });

  it('should handle error from worksList for tickets', async () => {
    // Mock the error for worksList when fetching tickets
    mockedBetaSDKMethods.worksList.mockRejectedValue(new Error('Failed to fetch tickets'));

    // Attempt to call worksList for tickets and catch the error
    try {
      await mockedBetaSDKMethods.worksList({ type: ['ticket'] });
    } catch (error: any) {
      // Verify that the error message is as expected
      expect(error.message).toBe('Failed to fetch tickets');
    }

    // Ensure worksList was indeed called with the ticket type filter
    expect(mockedBetaSDKMethods.worksList).toHaveBeenCalledWith({ type: ['ticket'] });
  });

  it('should call worksDelete for tickets and return success', async () => {
    // Mock the response for worksDelete for a ticket
    mockedBetaSDKMethods.worksDelete.mockResolvedValue({});

    // Call the worksDelete method for a specific ticket
    const response = await mockedBetaSDKMethods.worksDelete({ id: 'ticket1' });

    // Verify that worksDelete was called with the correct ticket id
    expect(mockedBetaSDKMethods.worksDelete).toHaveBeenCalledWith({ id: 'ticket1' });

    // Check that the response is as expected (empty object)
    expect(response).toEqual({});
  });

  it('should handle error from worksDelete for tickets', async () => {
    // Mock the error for worksDelete when deleting a ticket
    mockedBetaSDKMethods.worksDelete.mockRejectedValue(new Error('Failed to delete ticket'));

    // Attempt to call worksDelete for a ticket and catch the error
    try {
      await mockedBetaSDKMethods.worksDelete({ id: 'ticket1' });
    } catch (error: any) {
      // Verify that the error message is as expected
      expect(error.message).toBe('Failed to delete ticket');
    }

    // Ensure worksDelete was indeed called with the correct ticket id
    expect(mockedBetaSDKMethods.worksDelete).toHaveBeenCalledWith({ id: 'ticket1' });
  });
});
