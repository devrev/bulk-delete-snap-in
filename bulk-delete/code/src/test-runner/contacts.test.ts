import { mockedBetaSDKMethods } from './mocks/typescript-sdk.mock';

describe('Mocked SDK Method Tests', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  // Existing tests for accountsList, accountsDelete, revUsersList

  it('should call revUsersDelete and return success', async () => {
    // Mock the response for revUsersDelete
    mockedBetaSDKMethods.revUsersDelete.mockResolvedValue({});

    // Call the revUsersDelete method
    const response = await mockedBetaSDKMethods.revUsersDelete({ id: 'user1' });

    // Verify that the revUsersDelete was called with the correct argument
    expect(mockedBetaSDKMethods.revUsersDelete).toHaveBeenCalledWith({ id: 'user1' });

    // Check that the response is as expected (empty object)
    expect(response).toEqual({});
  });

  it('should handle error from revUsersDelete', async () => {
    // Mock the error for revUsersDelete
    mockedBetaSDKMethods.revUsersDelete.mockRejectedValue(new Error('Failed to delete user'));

    // Attempt to call revUsersDelete and catch the error
    try {
      await mockedBetaSDKMethods.revUsersDelete({ id: 'user1' });
    } catch (error: any) {
      // Verify that the error message is as expected
      expect(error.message).toBe('Failed to delete user');
    }

    // Ensure revUsersDelete was indeed called with the correct argument
    expect(mockedBetaSDKMethods.revUsersDelete).toHaveBeenCalledWith({ id: 'user1' });
  });
});
