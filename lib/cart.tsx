import { supabase } from "./supabase";
import React, {
    createContext,
    ReactNode,
    useContext,
    useEffect,
    useState,
} from "react";
import { MenuItemType } from "./types";
import { ActivityIndicator, Alert, View } from "react-native";

type Order = {
    id: string;
    created_at: string;
    updated_at: string;
    user: string | null;
    paid_at: string | null;
    accepted_at: string | null;
    ready_at: string | null;
    driver_collected_at: string | null;
    delivered_at: string | null;
    collected_at: string | null;
    completed_at: string | null;
    total_cost: number;
    total_items: number;
    pickup_window: string | null;
    comments: string;
    points_redeemed: number;
    points_earned: number;
};

type OrderItem = MenuItemType & { quantity: number };

export class Cart {
    #id: string;
    #created_at: Date;
    #updated_at: Date;
    #user: string | null;
    #paid_at: Date | null;
    #accepted_at: Date | null;
    #ready_at: Date | null;
    #driver_collected_at: Date | null;
    #delivered_at: Date | null;
    #collected_at: Date | null;
    #completed_at: Date | null;
    #total_cost: number;
    #total_items: number;
    #pickup_window: string | null;
    #comments: string;
    #points_redeemed: number;
    #points_earned: number;
    // Items are grouped into restaurants and then into items. [key: string] is the restaurant ID. The restaurant ID maps to an array of items
    #items: { id: string; name: string; items: OrderItem[] }[];

    private constructor(o: Order) {
        this.#id = o.id;
        this.#created_at = new Date(o.created_at);
        this.#updated_at = new Date(o.updated_at);
        this.#user = o.user;
        this.#paid_at = o.paid_at ? new Date(o.paid_at) : null;
        this.#accepted_at = o.accepted_at ? new Date(o.accepted_at) : null;
        this.#ready_at = o.ready_at ? new Date(o.ready_at) : null;
        this.#driver_collected_at = o.driver_collected_at
            ? new Date(o.driver_collected_at)
            : null;
        this.#delivered_at = o.delivered_at ? new Date(o.delivered_at) : null;
        this.#collected_at = o.collected_at ? new Date(o.collected_at) : null;
        this.#completed_at = o.completed_at ? new Date(o.completed_at) : null;
        this.#total_cost = o.total_cost;
        this.#total_items = o.total_items;
        this.#pickup_window = o.pickup_window;
        this.#comments = o.comments;
        this.#points_redeemed = o.points_redeemed;
        this.#points_earned = o.points_earned;
        this.#items = [];
    }

    public get totalItems() {
        return this.#total_items;
    }

    public get items() {
        return this.#items;
    }

    // Add an item to the user's cart, both locally and in the database
    public async addItem(item: MenuItemType, quantity: number) {
        // Find the restaurant this item belongs to.
        let restaurant = this.#items.find((restaurant) => {
            return restaurant.id === item.restaurant;
        });

        // If the restaurant does not exist then we can easily add the item and restaurant
        if (restaurant === undefined) {
            // Get some more details about the restaurant
            const { data, error } = await supabase
                .from("restaurant")
                .select("id, name")
                .eq("id", item.restaurant)
                .single<{ id: string; name: string }>();

            if (error && error.code !== "PGRST116") {
                throw error;
            }

            if (data === null) {
                throw new Error("Could not find item's restaurant.");
            }

            // Insert the new item into the order
            const { error: insertError } = await supabase
                .from("order_item")
                .insert([
                    {
                        order: this.#id,
                        item: item.id,
                        quantity,
                        line_total: item.price * quantity,
                    },
                ]);

            if (insertError) throw insertError;

            // Add the restaurant and item to the cart.
            this.#items.push({ ...data, items: [{ ...item, quantity }] });
        } else {
            // Find if the item exists in our "restaurant"
            const existingItem = restaurant.items.find((i) => {
                return i.id === item.id;
            });

            // If it does not exist we can add it...
            if (existingItem === undefined) {
                // Insert a new item into the order
                const { error: insertError } = await supabase
                    .from("order_item")
                    .insert([
                        {
                            order: this.#id,
                            item: item.id,
                            quantity,
                            line_total: item.price * quantity,
                        },
                    ]);

                if (insertError) throw insertError;

                restaurant.items.push({ ...item, quantity });
            } else {
                // Otherwise just update the quantity of the item
                // Update quantity and total price
                existingItem.quantity += quantity;
                const newTotal = existingItem.quantity * item.price;

                const { error: updateError } = await supabase
                    .from("order_item")
                    .update({
                        quantity: existingItem.quantity,
                        line_total: newTotal,
                    })
                    .eq('"order"', this.#id)
                    .eq("item", existingItem.id);

                if (updateError) throw updateError;
            }
        }

        // Update totals
        this.#total_cost += quantity * item.price;
        this.#total_items += quantity;

        // Update the cart to the database
        await this.update();
    }

    public async removeItem(item: MenuItemType, quantity: number) {
        let restaurant = this.#items.find((r) => r.id === item.restaurant);

        if (restaurant === undefined) {
            throw new Error("Could not get item's restaurant.");
        }

        let existingItem = restaurant.items.find((i) => i.id === item.id);

        if (existingItem === undefined) {
            return;
        }

        // If the item's quantity is greater than or equal to the quantity to remove, remove it from the order
        if (quantity >= existingItem.quantity) {
            const { error } = await supabase
                .from("order_item")
                .delete()
                .eq('"order"', this.#id)
                .eq("item", item.id);

            if (error != null) {
                throw error;
            }

            this.#items = this.#items
                .map((r) => {
                    r.items = r.items.filter((i) => i.id !== item.id);
                    return r;
                })
                .filter((r) => r.items.length > 0);
        } else {
            existingItem.quantity -= quantity;
            const newTotal = existingItem.quantity * item.price;

            const { error } = await supabase
                .from("order_item")
                .update({
                    quantity: existingItem.quantity,
                    line_total: newTotal,
                })
                .eq('"order"', this.#id)
                .eq("item", item.id);

            if (error !== null) {
                existingItem.quantity += quantity;
                throw error;
            }
        }

        this.#total_cost -= item.price * quantity;
        this.#total_items -= quantity;

        // Update the cart to the database
        await this.update();
    }

    public async removeAllItems() {
        let { error } = await supabase
            .from("order_item")
            .delete()
            .eq('"order"', this.#id);

        if (error !== null) throw error;

        this.#items = [];
        this.#total_cost = 0;
        this.#total_items = 0;

        await this.update();
    }

    // The total cost of the order
    public get total() {
        return this.#total_cost;
    }

    // Update the totals of the order
    private async update() {
        const { error: updateOrderError } = await supabase
            .from("order")
            .update({
                total_cost: this.#total_cost,
                total_items: this.#total_items,
                updated_at: new Date(),
            })
            .eq("id", this.#id);

        if (updateOrderError) throw updateOrderError;
    }

    public static async Init() {
        // Get the logged-in user's ID
        const { data: userData, error: userError } =
            await supabase.auth.getUser();
        if (userError || !userData?.user)
            throw new Error("User not authenticated");

        const userId = userData.user.id;

        // Fetch the most current order
        const existingOrder = await Cart.FetchOrder(userId);

        // If an unpaid order exists, check if it's expired (hasn't been updated in 24hours+)
        if (existingOrder) {
            // Convert updated_at to Date
            const updatedAt = existingOrder.updated_at
                ? new Date(existingOrder.updated_at)
                : null;
            const now = new Date();

            if (
                updatedAt &&
                now.getTime() - updatedAt.getTime() > 24 * 60 * 60 * 1000
            ) {
                // If last update was more than 24 hours ago, delete the order
                const { error: deleteOrderError } = await supabase
                    .from("order")
                    .delete()
                    .eq("id", existingOrder.id);

                if (deleteOrderError) throw deleteOrderError;

                // Create a new order
                return await Cart.CreateOrder(userId);
            } else {
                const cart = new Cart(existingOrder);

                const { data: existingItems, error: existingItemsError } =
                    await supabase
                        .from("order_item")
                        .select("*, item (*, restaurant (id, name))")
                        .eq('"order"', cart.#id)
                        .returns<
                            {
                                id: string;
                                created_at: string;
                                updated_at: string;
                                item: MenuItemType & {
                                    restaurant: { id: string; name: string };
                                };
                                line_total: number;
                                quantity: number;
                            }[]
                        >(); //need double quotations so doesn't get confused with sql ORDER (sorting)

                if (
                    existingItemsError &&
                    existingItemsError.code !== "PGRST116"
                )
                    throw existingItemsError;

                if (existingItems === null) {
                    throw new Error("Order items was null.");
                }

                let items: { id: string; name: string; items: OrderItem[] }[] =
                    [];
                existingItems.forEach((orderitem) => {
                    const { item } = orderitem;
                    const restaurant = items.find(
                        (r) => r.id === item.restaurant.id
                    );
                    if (restaurant === undefined) {
                        items.push({
                            id: item.restaurant.id,
                            name: item.restaurant.name,
                            items: [
                                {
                                    id: item.id,
                                    created_at: item.created_at,
                                    updated_at: item.updated_at,
                                    name: item.name,
                                    restaurant: item.restaurant.id,
                                    image_url: item.image_url,
                                    description: item.description,
                                    price: item.price,
                                    category: item.category,
                                    quantity: orderitem.quantity,
                                },
                            ],
                        });
                    } else {
                        const existingItem = restaurant.items.find(
                            (i) => i.id === item.id
                        );
                        if (existingItem === undefined) {
                            restaurant.items.push({
                                id: item.id,
                                created_at: item.created_at,
                                updated_at: item.updated_at,
                                name: item.name,
                                restaurant: item.restaurant.id,
                                image_url: item.image_url,
                                description: item.description,
                                price: item.price,
                                category: item.category,
                                quantity: orderitem.quantity,
                            });
                        } else {
                            existingItem.quantity++;
                        }
                    }
                });

                cart.#items = items;

                return cart;
            }
        } else {
            // If no existing order, create a new one
            return await Cart.CreateOrder(userId);
        }
    }

    // Create the order and return it so we can use it straight away
    private static async CreateOrder(userId: string) {
        const { data: newOrder, error: newOrderError } = await supabase
            .from("order")
            .insert([{ user: userId, total_cost: 0, total_items: 0 }])
            .select()
            .single<Order>();

        if (newOrderError) throw newOrderError;

        return new Cart(newOrder);
    }

    // Check for an existing unpaid order
    private static async FetchOrder(userId: string) {
        const { data, error: orderError } = await supabase
            .from("order")
            .select("*")
            .eq("user", userId)
            .is("paid_at", null)
            .single<Order>();

        if (orderError && orderError.code !== "PGRST116") throw orderError;

        return data;
    }

    public setComment = async (comment: string) => {
        const { error } = await supabase
            .from("order")
            .update({ comments: comment, updated_at: new Date() })
            .eq("id", this.#id);

        if (error) throw error;
    };

    public async completeOrder(pickupWindowId: string, paymentIntent: string) {
        try {
            // Track processed restaurant IDs to avoid duplicate updates
            const processedRestaurants = new Set<string>();

            for (const restaurantGroup of this.#items) {
                const restaurantId = restaurantGroup.id;

                // Skip if already processed in this order
                if (processedRestaurants.has(restaurantId)) {
                    continue;
                }

                // Get restaurant daily limit
                const { data: restaurantData, error: restaurantError } =
                    await supabase
                        .from("restaurant")
                        .select("daily_limit, is_busy")
                        .eq("id", restaurantId)
                        .single();

                if (restaurantError) {
                    console.error(
                        `Error fetching restaurant ${restaurantId}:`,
                        restaurantError
                    );
                    throw restaurantError;
                }
                if (!restaurantData) {
                    console.error(`Restaurant ${restaurantId} not found`);
                    throw new Error(`Restaurant ${restaurantId} not found`);
                }

                const dailyLimit = restaurantData.daily_limit;

                const { data: dailyOrderData, error: dailyOrderError } =
                    await supabase
                        .from("daily_orders")
                        .select("orders_today")
                        .eq("restaurant_id", restaurantId)
                        .single();

                if (dailyOrderError) {
                    console.error(
                        `Error fetching daily_orders for restaurant ${restaurantId}:`,
                        dailyOrderError
                    );
                    throw dailyOrderError;
                }
                if (!dailyOrderData) {
                    console.error(
                        `Daily order entry missing for restaurant ${restaurantId}`
                    );
                    throw new Error(
                        `Daily order entry missing for restaurant ${restaurantId}`
                    );
                }

                let currentCount = dailyOrderData.orders_today;

                // Increment daily count
                currentCount += 1;

                // Update the daily_order table
                const { error: updateDailyError } = await supabase
                    .from("daily_orders")
                    .update({ orders_today: currentCount })
                    .eq("restaurant_id", restaurantId);

                if (updateDailyError) {
                    console.error(
                        `Error updating daily_order for restaurant ${restaurantId}:`,
                        updateDailyError
                    );
                    throw updateDailyError;
                }

                // If count reaches or exceeds limit, mark restaurant as busy
                if (currentCount >= dailyLimit && !restaurantData.is_busy) {
                    const { error: updateRestaurantError } = await supabase
                        .from("restaurant")
                        .update({ is_busy: true })
                        .eq("id", restaurantId);

                    if (updateRestaurantError) {
                        console.error(
                            `Error marking restaurant ${restaurantId} as busy:`,
                            updateRestaurantError
                        );
                        throw updateRestaurantError;
                    }
                }

                processedRestaurants.add(restaurantId);
            }

            // Finally, mark this cart/order as completed
            const now = new Date().toISOString();

            const { error: completeOrderError } = await supabase
                .from("order")
                .update({
                    paid_at: now,
                    updated_at: now,
                    pickup_window: pickupWindowId,
                    stripe_payment_intent: paymentIntent,
                })
                .eq("id", this.#id);

            if (completeOrderError) {
                console.error(
                    `Error completing order ${this.#id}:`,
                    completeOrderError
                );
                throw completeOrderError;
            }
        } catch (error) {
            console.error("Unexpected error during completeOrder:", error);
            throw error; // Re-throw to let calling code handle
        }
    }
}

// A React context for our cart so we can share it across components
const CartContext = createContext<
    | {
          items: {
              id: string;
              name: string;
              items: OrderItem[];
          }[];
          addItem: (item: MenuItemType, quantity: number) => Promise<void>;
          removeItem: (item: MenuItemType, quantity: number) => Promise<void>;
          removeAllItems: () => Promise<void>;
          setComment: (comment: string) => Promise<void>;
          totalItems: number;
          total: number;
          vouchersUsed: number;
          setVouchersUsed: (count: number) => void;
          discountAmount: number;
          finalTotal: number;
          completeOrder: (
              pickupWindowId: string,
              paymentIntent: string
          ) => Promise<void>;
          reset: () => Promise<void>;
      }
    | undefined
>(undefined);

// A component to provide functions and data about our cart across child nodes
export const CartProvider = ({ children }: { children: ReactNode }) => {
    const [cart, setCart] = useState<Cart | null>(null);
    const [items, setItems] = useState<
        {
            id: string;
            name: string;
            items: OrderItem[];
        }[]
    >([]);
    const [totalItems, setTotalItems] = useState(0);
    const [total, setTotal] = useState(0);
    const [vouchersUsed, setVouchersUsed] = useState(0);
    const [discountAmount, setDiscountAmount] = useState(0);
    const [finalTotal, setFinalTotal] = useState(0);

    useEffect(() => {
        const initializeCart = async () => {
            try {
                const newCart = await Cart.Init();
                setCart(newCart);
                setItems(newCart.items);
                setTotalItems(newCart.totalItems);
                setTotal(newCart.total);
                setFinalTotal(newCart.total);
            } catch (error) {
                console.error("Error adding to cart:", error);
                Alert.alert("Error", "Failed to add item to cart.");
            }
        };

        initializeCart();
    }, []);

    // Update discount amount and final total when vouchers used changes
    useEffect(() => {
        const discount = vouchersUsed * 15; // Each voucher is worth $15
        setDiscountAmount(discount);
        setFinalTotal(Math.max(0, total - discount));
    }, [vouchersUsed, total]);

    if (cart === null || cart === undefined) {
        return (
            <View
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                }}
            >
                <ActivityIndicator size="large" color="#00BFA6" />
            </View>
        );
    }

    // Add an item to the cart given with a quantity
    const addItem = async (item: MenuItemType, quantity: number) => {
        await cart.addItem(item, quantity);
        setCart(cart);
        setItems(cart.items);
        setTotal(cart.total);
        setTotalItems(cart.totalItems);
    };

    // Remove an item to the cart given with a quantity
    const removeItem = async (item: MenuItemType, quantity: number) => {
        await cart.removeItem(item, quantity);
        setCart(cart);
        setItems(cart.items);
        setTotal(cart.total);
        setTotalItems(cart.totalItems);
    };

    const removeAllItems = async () => {
        await cart.removeAllItems();
        setCart(cart);
        setItems(cart.items);
        setTotal(cart.total);
        setTotalItems(cart.totalItems);
    };

    const setComment = async (comment: string) => {
        await cart.setComment(comment);
    };

    const completeOrder = async (
        pickupWindowId: string,
        paymentIntent: string
    ) => {
        await cart.completeOrder(pickupWindowId, paymentIntent);
    };

    const reset = async () => {
        const newCart = await Cart.Init();
        setCart(newCart);
        setItems(newCart.items);
        setTotalItems(newCart.totalItems);
        setTotal(newCart.total);
        setFinalTotal(newCart.total);
    };

    return (
        <CartContext.Provider
            value={{
                items,
                addItem,
                removeItem,
                removeAllItems,
                setComment,
                total,
                totalItems,
                vouchersUsed,
                setVouchersUsed,
                discountAmount,
                finalTotal,
                completeOrder,
                reset,
            }}
        >
            {children}
        </CartContext.Provider>
    );
};

// Helper to get the cart context
export const useCart = () => {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error("useCart must be used within a CartProvider");
    }
    return context;
};
