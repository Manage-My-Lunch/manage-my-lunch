export type MenuItemType = {
    id: string;
    created_at: string;
    updated_at: string;
    restaurant: string | null;
    image_url: string;
    description: string;
    price: number;
    name: string;
    category: string;
};

export type RestaurantType = {
    id: string;
    name: string;
    description: string;
    is_open: boolean;
    image_url: string;
    is_busy: boolean;
};

export type Allergen = {
    id: string;
    name: string;
}