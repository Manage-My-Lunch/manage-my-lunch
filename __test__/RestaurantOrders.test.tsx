import { useLocalSearchParams } from "expo-router";
import RestaurantOrders from "@/app/restaurant/orders";
import { render, screen, waitFor, cleanup } from "@testing-library/react-native";
import { NavigationContainer } from "@react-navigation/native";

// Mock expo-router
jest.mock("expo-router", () => ({
  useLocalSearchParams: jest.fn(),
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn(),
  })),
}));

// Mock Supabase client
jest.mock("@/lib/supabase", () => {
  const mockSupabase = {
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: {
          user: { id: "user-id", email: "test@example.com" },
        },
        error: null,
      }),
      getSession: jest.fn().mockResolvedValue({
        data: {
        session: {
            user: { id: "user-id" }
        }
        },
        error: null
      }),
    },
    from: jest.fn((table: string) => {
      const chain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        is: jest.fn().mockReturnThis(),
        returns: jest.fn().mockReturnThis(),
        single: jest.fn().mockImplementation(() => {
          if (table === "restaurant_users") {
            return Promise.resolve({
              data: {
                restaurant_id: "02ef6fb0-13cc-4ad8-8a6f-4a2b34eb0a53",
                user_id: "user-id",
              },
              error: null,
            });
          }
          if (table === "restaurant") {
            return Promise.resolve({
              data: {
                id: "02ef6fb0-13cc-4ad8-8a6f-4a2b34eb0a53",
                name: "Pizza Palace",
              },
              error: null,
            });
          }
          if (table === "order_item") {
            return Promise.resolve({
              data: {
                id: "08cdce8b-f8bb-4b3c-996a-20b67af87f66",
                item: "0f9eb04f-7dda-46ac-abc2-4a14a9b8af3c",
                order: "79591544-e001-4975-b40c-9fc647497027",
                quantity: 1,
                line_total: 12.99,
              },
              error: null,
            });
          }
          return Promise.resolve({
            data: null,
            error: new Error(`Unknown table in .single(): ${table}`),
          });
        }),
        then: jest.fn((callback) => {
          if (table === "item") {
            return callback({
              data: {
                id: "0f9eb04f-7dda-46ac-abc2-4a14a9b8af3c",
                name: "Pizza",
                description: "Delicious cheese pizza",
                price: 12.99,
                restaurant: "02ef6fb0-13cc-4ad8-8a6f-4a2b34eb0a53",
              },
              error: null,
            });
          }
          if (table === "order") {
            return callback({
              data: {
                id: "79591544-e001-4975-b40c-9fc647497027",
                user: "user2-id",
                paid_at: "2023-05-25T10:00:00Z",
                total_cost: 12.99,
                total_items: 1,
              },
              error: null,
            });
          }
          if (table === "order_item") {
            return callback({
                data: [
                {
                    id: "08cdce8b-f8bb-4b3c-996a-20b67af87f66",
                    item: {
                    id: "0f9eb04f-7dda-46ac-abc2-4a14a9b8af3c",
                    name: "Pizza",
                    price: 12.99,
                    restaurant: "02ef6fb0-13cc-4ad8-8a6f-4a2b34eb0a53"
                    },
                    order: {
                    id: "79591544-e001-4975-b40c-9fc647497027",
                    total_cost: 12.99,
                    total_items: 1,
                    paid_at: "2023-05-25T10:00:00Z",
                    accepted_at: null,
                    ready_at: null,
                    pickup_window: {
                        id: "window-id",
                        open: new Date().toISOString(), // make it today
                        close: new Date(new Date().getTime() + 30 * 60 * 1000).toISOString()
                    },
                    comments: "No onions"
                    },
                    quantity: 1,
                    line_total: 12.99
                }
                ],
                error: null
            });
            }
          return callback({
            data: null,
            error: new Error(`Unknown table in .then(): ${table}`),
          });
        }),
      };

      return chain;
    }),
  };
  return { supabase: mockSupabase };
});

describe("RestaurantOrders", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders restaurant name and orders", async () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({});

    render(
      <NavigationContainer>
        <RestaurantOrders />
      </NavigationContainer>
    );

    expect(screen.getByTestId("ActivityIndicator")).toBeTruthy();

    await waitFor(() => {
      expect(screen.getByText("Pizza Palace")).toBeTruthy();
    });

    expect(screen.getByText("Pizza")).toBeTruthy();
    expect(screen.getByText("No onions")).toBeTruthy();
  });
});
