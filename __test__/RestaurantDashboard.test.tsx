import React from "react";
import { render, waitFor } from "@testing-library/react-native";
import RestaurantDashboard from "@/app/restaurant/index";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";

// Mock dependencies
jest.mock("@/components/withRoleProtection", () => (component: any) => component);
jest.mock("@/components/alert", () => jest.fn());
jest.mock("expo-router", () => ({
  useRouter: jest.fn(),
}));

jest.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      signOut: jest.fn(),
    },
    from: jest.fn(),
  },
}));

describe("RestaurantDashboard", () => {
  const mockReplace = jest.fn();

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({ replace: mockReplace, push: jest.fn() });
  });

  it("renders restaurant name after loading", async () => {
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: {
        session: {
          user: { id: "user1" },
        },
      },
      error: null,
    });

    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      switch (table) {
        case "restaurant_users":
          return {
            select: () => ({
              eq: () => ({
                single: () =>
                  Promise.resolve({
                    data: { restaurant_id: "restaurant1" },
                    error: null,
                  }),
              }),
            }),
          };
        case "restaurant":
          return {
            select: () => ({
              eq: () => ({
                single: () =>
                  Promise.resolve({
                    data: {
                      name: "Test Restaurant",
                      is_busy: false,
                      daily_limit: 10,
                    },
                    error: null,
                  }),
              }),
            }),
          };
        default:
          return {
            select: () => ({
              eq: () => ({
                single: () =>
                  Promise.resolve({
                    data: { orders_today: 5 },
                    error: null,
                  }),
              }),
            }),
          };
      }
    });

    const { getByText } = render(<RestaurantDashboard />);

    await waitFor(() => {
      expect(getByText("Welcome to Test Restaurant!")).toBeTruthy();
    });
  });

});
