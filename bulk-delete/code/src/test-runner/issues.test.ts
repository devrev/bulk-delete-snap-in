import { mockedBetaSDKMethods } from './mocks/typescript-sdk.mock';

describe('Mocked SDK Method Tests', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  // Existing tests for accountsList, accountsDelete, revUsersList, revUsersDelete

  it('should call worksList and return a list of works', async () => {
    // Mock the response for worksList
    mockedBetaSDKMethods.worksList.mockResolvedValue({
      data: {
        works: [{ id: 'work1', title: 'Work 1' }],
      },
    });

    // Call the worksList method
    const response = await mockedBetaSDKMethods.worksList();

    // Verify that worksList was called
    expect(mockedBetaSDKMethods.worksList).toHaveBeenCalled();

    // Check that the response matches the expected mocked data
    expect(response).toEqual({
      data: {
        works: [{ id: 'work1', title: 'Work 1' }],
      },
    });
  });

  it('should handle error from worksList', async () => {
    // Mock the error for worksList
    mockedBetaSDKMethods.worksList.mockRejectedValue(new Error('Failed to fetch works'));

    // Attempt to call worksList and catch the error
    try {
      await mockedBetaSDKMethods.worksList();
    } catch (error: any) {
      // Verify that the error message is as expected
      expect(error.message).toBe('Failed to fetch works');
    }

    // Ensure worksList was indeed called
    expect(mockedBetaSDKMethods.worksList).toHaveBeenCalled();
  });

  it('should call worksDelete and return success', async () => {
    // Mock the response for worksDelete
    mockedBetaSDKMethods.worksDelete.mockResolvedValue({});

    // Call the worksDelete method
    const response = await mockedBetaSDKMethods.worksDelete({ id: 'work1' });

    // Verify that worksDelete was called with the correct argument
    expect(mockedBetaSDKMethods.worksDelete).toHaveBeenCalledWith({ id: 'work1' });

    // Check that the response is as expected (empty object)
    expect(response).toEqual({});
  });

  it('should handle error from worksDelete', async () => {
    // Mock the error for worksDelete
    mockedBetaSDKMethods.worksDelete.mockRejectedValue(new Error('Failed to delete work'));

    // Attempt to call worksDelete and catch the error
    try {
      await mockedBetaSDKMethods.worksDelete({ id: 'work1' });
    } catch (error: any) {
      // Verify that the error message is as expected
      expect(error.message).toBe('Failed to delete work');
    }

    // Ensure worksDelete was indeed called with the correct argument
    expect(mockedBetaSDKMethods.worksDelete).toHaveBeenCalledWith({ id: 'work1' });
  });

  it('should call issues and return a list of issues', async () => {
    // Mock the response for issues
    mockedBetaSDKMethods.worksList.mockResolvedValue({
      data: {
        works: [{ description: 'Issue 1', id: 'issue1' }],
      },
    });

    // Call the issues method
    const response = await mockedBetaSDKMethods.worksList();

    // Verify that issues was called
    expect(mockedBetaSDKMethods.worksList).toHaveBeenCalled();

    // Check that the response matches the expected mocked data
    expect(response).toEqual({
      data: {
        works: [{ description: 'Issue 1', id: 'issue1' }],
      },
    });
  });

  it('should handle error from issues', async () => {
    // Mock the error for issues
    mockedBetaSDKMethods.worksList.mockRejectedValue(new Error('Failed to fetch issues'));

    // Attempt to call issues and catch the error
    try {
      await mockedBetaSDKMethods.worksList();
    } catch (error: any) {
      // Verify that the error message is as expected
      expect(error.message).toBe('Failed to fetch issues');
    }

    // Ensure issues was indeed called
    expect(mockedBetaSDKMethods.worksList).toHaveBeenCalled();
  });
});
