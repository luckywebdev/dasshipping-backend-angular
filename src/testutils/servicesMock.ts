export const PaymentServiceMock = jest.fn().mockImplementation(() => {
    return {
        getClientToken: jest.fn(),
        deletePaymentMethod: jest.fn(),
        addPaymentMethod: jest.fn(),
        removePaymentMethod: jest.fn(),
        createPaymentMethod: jest.fn(),
        sale: jest.fn(),
        submitForSettlement: jest.fn(),
    };
});
