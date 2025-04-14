export interface MenuItemType {
    id: string;
    created_at: string;
    updated_at: string;
    restaurant: string;
    image_url: string;
    description: string;
    price: number;
    name: string;
    category: string;
};

export interface RestaurantType {
    id: string;
    name: string;
    description: string;
    is_open: boolean;
    image_url: string;
    is_busy: boolean;
    monthly_sale: number;
};

export interface RestaurantCategory {
    id: string,
    restaurant: string,
    category: string
}

export interface Category {
    id: string,
    name: string
}

export interface Allergen {
    id: string;
    name: string;
}

export interface UserProfile {
    id: string;
    email?: string;
    points: number;
    voucher_count: number;
    first_name?: string;
    last_name?: string;
    university?: string;
    preferred_campus?: string;
    role?: string;
}