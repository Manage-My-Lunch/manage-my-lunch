import { useLocalSearchParams } from "expo-router";
import MenuItemDetail from "@/app/student/menu/detail";
import { render, screen, waitFor, cleanup } from "@testing-library/react-native";
import { NavigationContainer } from "@react-navigation/native";
import { CartProvider } from "@/lib/cart";

// Mock expo-router
jest.mock("expo-router", () => ({
  useLocalSearchParams: jest.fn(),
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
    },
    from: jest.fn((table: string) => {
      const chain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        is: jest.fn().mockReturnThis(),
        returns: jest.fn().mockReturnThis(),
        single: jest.fn().mockImplementation(() => {
          if (table === "item") {
            return Promise.resolve({
              data: {
                id: "0f9eb04f-7dda-46ac-abc2-4a14a9b8af3c",
                name: "Pizza",
                description: "Delicious cheese pizza",
                price: 12.99,
              },
              error: null,
            });
          }
          if (table === "order") {
            return Promise.resolve({
              data: {
                id: "79591544-e001-4975-b40c-9fc647497027",
                user: "user-id",
                total_cost: 12.99,
                total_items: 1,
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
          if (table === "allergen") {
            return callback({
              data: [
                { id: "7cd6866b-1fba-4960-8df1-349e0540173f", name: "Dairy" },
                { id: "1ce0e966-b6d3-465e-adec-62cf3d545461", name: "Gluten" },
              ],
              error: null,
            });
          }
          if (table === "item_allergen") {
            return callback({
              data: [
                {
                  id: "A",
                  allergen: "7cd6866b-1fba-4960-8df1-349e0540173f",
                  item: "0f9eb04f-7dda-46ac-abc2-4a14a9b8af3c",
                },
                {
                  id: "B",
                  allergen: "1ce0e966-b6d3-465e-adec-62cf3d545461",
                  item: "0f9eb04f-7dda-46ac-abc2-4a14a9b8af3c",
                },
              ],
              error: null,
            });
          }
          if (table === "order_item") {
            return callback({
              data: [],
              error: null,
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

describe("MenuItemDetail", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      id: "0f9eb04f-7dda-46ac-abc2-4a14a9b8af3c",
    });
  });

  const renderComponent = () => {
    return render(
      <CartProvider>
        <NavigationContainer>
          <MenuItemDetail />
        </NavigationContainer>
      </CartProvider>
    );
  };

  it("renders correctly with search params and fetched data", async () => {
    renderComponent();  

    await waitFor(() => {
      expect(screen.getByText("Pizza")).toBeTruthy();
      expect(screen.getByText("Delicious cheese pizza")).toBeTruthy();
    });
  });
});

afterEach(() => {
  cleanup();
  jest.restoreAllMocks();
  jest.clearAllMocks();
});
