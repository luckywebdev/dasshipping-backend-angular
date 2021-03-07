
export const repositoryMockFactory = jest.fn().mockImplementation(() => {
    return {
        findOne: jest.fn(entity => entity),
        save: jest.fn(entity => entity),
        get: jest.fn(entity => entity),
        delete: jest.fn(entity => entity),
        getJoinedRequests: jest.fn(),
        update: jest.fn(),
        joinCompany: jest.fn(),
        find: jest.fn(),
        getAccount: jest.fn(),
        insert: jest.fn(),
        getAccountsList: jest.fn(),
        getCount: jest.fn(),
        getVisibleCount: jest.fn(),
        remove: jest.fn(),
        getDriversForDispatcher: jest.fn(),
        getAccountsLastLocation: jest.fn(),
        getByUserReport: jest.fn(),
    };
});
