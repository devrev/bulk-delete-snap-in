import { mockedBetaSDKMethods } from './mocks/typescript-sdk.mock';

describe('Mocked SDK Method Tests', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should call accountsList and return a list of accounts', async () => {
    // Mock the response for accountsList
    mockedBetaSDKMethods.accountsList.mockResolvedValue({
      data: {
        accounts: [{ id: '1', name: 'Account 1' }],
      },
    });

    // Call the accountsList method
    const response = await mockedBetaSDKMethods.accountsList({ tags: ['test-tag'] });

    // Verify that the accountsList was called with the correct arguments
    expect(mockedBetaSDKMethods.accountsList).toHaveBeenCalledWith({ tags: ['test-tag'] });

    // Check that the response matches the expected mocked data
    expect(response).toEqual({
      data: {
        accounts: [{ id: '1', name: 'Account 1' }],
      },
    });
  });

  it('should handle error from accountsList', async () => {
    // Mock the error for accountsList
    mockedBetaSDKMethods.accountsList.mockRejectedValue(new Error('Failed to fetch accounts'));

    // Attempt to call accountsList and catch the error
    try {
      await mockedBetaSDKMethods.accountsList({ tags: ['test-tag'] });
    } catch (error: any) {
      // Verify that the error message is as expected
      expect(error.message).toBe('Failed to fetch accounts');
    }

    // Ensure the accountsList was indeed called
    expect(mockedBetaSDKMethods.accountsList).toHaveBeenCalledWith({ tags: ['test-tag'] });
  });

  it('should call accountsDelete and return success', async () => {
    // Mock the response for accountsDelete
    mockedBetaSDKMethods.accountsDelete.mockResolvedValue({});

    // Call the accountsDelete method
    const response = await mockedBetaSDKMethods.accountsDelete({ id: '1' });

    // Verify that the accountsDelete was called with the correct argument
    expect(mockedBetaSDKMethods.accountsDelete).toHaveBeenCalledWith({ id: '1' });

    // Check that the response is as expected (empty object)
    expect(response).toEqual({});
  });

  it('should handle error from accountsDelete', async () => {
    // Mock the error for accountsDelete
    mockedBetaSDKMethods.accountsDelete.mockRejectedValue(new Error('Failed to delete account'));

    // Attempt to call accountsDelete and catch the error
    try {
      await mockedBetaSDKMethods.accountsDelete({ id: '1' });
    } catch (error: any) {
      // Verify that the error message is as expected
      expect(error.message).toBe('Failed to delete account');
    }

    // Ensure the accountsDelete was indeed called
    expect(mockedBetaSDKMethods.accountsDelete).toHaveBeenCalledWith({ id: '1' });
  });

  it('should call revUsersList and return a list of users', async () => {
    // Mock the response for revUsersList
    mockedBetaSDKMethods.revUsersList.mockResolvedValue({
      data: {
        users: [{ id: 'user1', name: 'User 1' }],
      },
    });

    // Call the revUsersList method
    const response = await mockedBetaSDKMethods.revUsersList();

    // Ensure revUsersList was called
    expect(mockedBetaSDKMethods.revUsersList).toHaveBeenCalled();

    // Verify the response matches the expected mocked data
    expect(response).toEqual({
      data: {
        users: [{ id: 'user1', name: 'User 1' }],
      },
    });
  });

  it('should handle error from revUsersList', async () => {
    // Mock the error for revUsersList
    mockedBetaSDKMethods.revUsersList.mockRejectedValue(new Error('Failed to fetch users'));

    // Attempt to call revUsersList and catch the error
    try {
      await mockedBetaSDKMethods.revUsersList();
    } catch (error: any) {
      // Verify that the error message is as expected
      expect(error.message).toBe('Failed to fetch users');
    }

    // Ensure revUsersList was indeed called
    expect(mockedBetaSDKMethods.revUsersList).toHaveBeenCalled();
  });
});
