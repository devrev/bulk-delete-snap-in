export const mockedPublicSDKMethods = {};

export const mockedBetaSDKMethods = {
  accountsDelete: jest.fn(),
  accountsList: jest.fn(),
  revUsersDelete: jest.fn(),
  revUsersList: jest.fn(),
  worksDelete: jest.fn(),
  worksList: jest.fn(),
};

export const client = {
  setup: jest.fn().mockReturnValue(mockedPublicSDKMethods),
  setupBeta: jest.fn().mockReturnValue(mockedBetaSDKMethods),
};
