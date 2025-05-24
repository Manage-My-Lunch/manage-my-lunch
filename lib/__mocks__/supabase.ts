const mockStartAutoRefresh = jest.fn();
const mockStopAutoRefresh = jest.fn();

const mockGetSession = jest.fn().mockResolvedValue({
  data: {
    session: { user: { id: "user-123" } },
  },
  error: null,
});

// Helper to create chainable query mocks with customizable resolved values
const createQueryMock = (resolvedValue: any) => {
  const single = jest.fn().mockResolvedValue(resolvedValue);
  const eq = jest.fn(() => ({ single }));
  const select = jest.fn(() => ({ eq }));
  return { select, eq, single };
};

// Default mock responses for from()
const from = jest.fn((tableName: string) => {
  if (tableName === "user") {
    return createQueryMock({
      data: { role: "restaurant_owner" },
      error: null,
    });
  }
  if (tableName === "restaurant_users") {
    return createQueryMock({
      data: [{ restaurant_id: "restaurant-123" }],
      error: null,
    });
  }
  if (tableName === "orders") {
    return createQueryMock({
      data: [
        {
          id: "order-001",
          item: "Pizza",
          quantity: 2,
          price: 10.0,
          total: 20.0,
          comments: "Extra cheese",
          status: "pending",
          pickup_start: "11:22",
          pickup_end: "12:22",
          restaurant_name: "Pizza Palace",
        },
      ],
      error: null,
    });
  }
  return createQueryMock({ data: [], error: null });
});

export const supabase = {
  auth: {
    getSession: mockGetSession,
    startAutoRefresh: mockStartAutoRefresh,
    stopAutoRefresh: mockStopAutoRefresh,
  },
  from,
};
