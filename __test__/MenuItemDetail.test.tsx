import { useLocalSearchParams } from "expo-router";
import MenuItemDetail from "@/app/student/menu/detail";
import { render, screen, waitFor, cleanup } from "@testing-library/react-native";
import { NavigationContainer } from "@react-navigation/native";

// Mock expo-router
jest.mock("expo-router", () => ({
  useLocalSearchParams: jest.fn(),
}));

// Mock Supabase client
jest.mock("@/lib/supabase", () => {
  const mockSupabase = {
    from: jest.fn((table: string) => {
      console.log(`Fetching data from table: ${table}`); // Debugging log
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
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
          return Promise.resolve({ data: null, error: new Error("Unknown table") });
        }),
        // Mocking .then() for list fetching
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
                { id: "A", allergen: "7cd6866b-1fba-4960-8df1-349e0540173f", item: "0f9eb04f-7dda-46ac-abc2-4a14a9b8af3c" },
                { id: "B", allergen: "1ce0e966-b6d3-465e-adec-62cf3d545461", item: "0f9eb04f-7dda-46ac-abc2-4a14a9b8af3c" },
              ],
              error: null,
            });
          }
          return callback({ data: null, error: new Error("Unknown table") });
        }),
      };
    }),
  };
  return { supabase: mockSupabase };
});

import { supabase } from "@/lib/supabase";

describe("MenuItemDetail", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      id: "0f9eb04f-7dda-46ac-abc2-4a14a9b8af3c",
    });
  });

  const renderComponent = async () => {
    render(
      <NavigationContainer>
        <MenuItemDetail />
      </NavigationContainer>
    );
  };

  it("renders correctly with search params and fetched data", async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("Pizza")).toBeTruthy();
      expect(screen.getByText("Delicious cheese pizza")).toBeTruthy();
    });    
  });

  it("displays an error message when fetching fails", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  
    (supabase.from as jest.Mock).mockImplementationOnce(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: null,
        error: { message: "Failed to fetch" },
      }),
    }));
  
    renderComponent();
  
    await waitFor(() => {
      expect(screen.getByText("Failed to fetch menu item")).toBeTruthy();
    });
  
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error fetching menu item:",
      expect.objectContaining({ message: "Failed to fetch" })
    );
  
    consoleErrorSpy.mockRestore();
  });
});

afterEach(() => {
  cleanup();
  jest.restoreAllMocks();
  jest.clearAllMocks();
});
