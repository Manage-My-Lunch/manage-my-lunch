import { useEffect, useState } from "react";
import {
    Text,
    View,
    FlatList,
    TouchableOpacity,
    Image,
    StyleSheet,
    ActivityIndicator,
    Modal,
    Pressable,
    Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import withRoleProtection from "@/components/withRoleProtection";
import { RestaurantType } from "@/lib/types";
import CuisineList from "@/components/student/menu/CuisineList";
import OrderNotificationIcon from "@/components/OrderNotificationIcon";

type MenuRestaurant = RestaurantType & {
    restaurant_category: { category: { id: string; name: string } }[];
};

type SortType = "default" | "popularity";

export function Index() {
    const router = useRouter();
    const [restaurants, setRestaurants] = useState<MenuRestaurant[]>([]);
    const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [sortType, setSortType] = useState<SortType>("default");
    const [showSortModal, setShowSortModal] = useState(false);
    
    useEffect(() => {
        fetchRestaurants();
    }, [sortType]);

    const formatPopularity = (value: number): string => {
        if (value >= 1000) return `${Math.floor(value / 1000) * 1000}+`;
        if (value >= 100) return `${Math.floor(value / 100) * 100}+`;
        return value.toString();
    };

    const handleFilter = (id: string | null) => {
        if (categoryFilter === id) {
            setCategoryFilter(null);
        } else {
            setCategoryFilter(id);
        }
    };

    const fetchRestaurants = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from("restaurant")
                .select("*, restaurant_category(category(*))");

            if (error) throw error;

            // Sort restaurants: is_busy === true last
            const sortedData = data.sort((a, b) => {
                if (sortType === "popularity") {
                    return (b.monthly_sale || 0) - (a.monthly_sale || 0);
                } else {
                    if (a.is_busy === b.is_busy) return 0;
                    return !a.is_busy ? -1 : 1;
                }
            });

            setRestaurants(sortedData);
        } catch (error) {
            console.error("Error fetching restaurants:", error);
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({
        item,
    }: {
        item: MenuRestaurant;
    }): React.ReactElement => {
        if (
            categoryFilter === null ||
            item.restaurant_category.findIndex((c) => {
                return c.category.id === categoryFilter;
            }) > -1
        ) {
            return (
                <TouchableOpacity
                    style={[
                        styles.restaurantItem,
                        item.is_busy && styles.disabledItem,
                    ]}
                    onPress={() =>
                        router.push({
                            pathname: "/student/menu/restaurant",
                            params: { restaurantId: item.id },
                        })
                    }
                    disabled={item.is_busy}
                >
                    <View style={styles.imageContainer}>
                        <Image
                            source={{ uri: item.image_url }}
                            style={styles.restaurantImage}
                        />
                        {item.is_busy && (
                            <Image
                                source={require("@/assets/images/busy.png")}
                                style={styles.busyOverlay}
                            />
                        )}
                    </View>
                    <Text style={styles.restaurantName}>{item.name}</Text>
                    <View style={styles.infoContainer}>
                        <Text style={styles.restaurantDescription}>
                            {item.description}
                        </Text>
                        <View style={styles.popularityContainer}>
                            <Image
                                source={require("@/assets/images/star.png")}
                                style={[
                                    styles.starIcon,
                                    sortType === "popularity" && { opacity: 1 },
                                ]}
                            />
                            <Text
                                style={[
                                    styles.popularityText,
                                    sortType === "popularity" && { opacity: 1 },
                                ]}
                            >
                                {formatPopularity(item.monthly_sale || 0)}
                            </Text>
                        </View>
                    </View>
                </TouchableOpacity>
            );
        }

        return <></>;
    };

    return (
        <View style={styles.container}>
            <CuisineList
                filter={categoryFilter}
                handleFilter={handleFilter}
            ></CuisineList>
            
            {/* Notification Button */}
            <View style={styles.notificationContainer}>
                <TouchableOpacity 
                    style={styles.notificationButton}
                    // Navigation to order page
                    onPress={() => {}}
                >
                    <OrderNotificationIcon count={0} />
                    <Text style={styles.notificationText}>
                        Your current orders
                    </Text>
                </TouchableOpacity>
            </View>
            
            {/* Filter Section */}
            <View style={styles.filterSection}>
                <Pressable
                    style={styles.sortButton}
                    onPress={() => setShowSortModal(true)}
                >
                    <Text style={styles.sortButtonText}>
                        Sort Restaurants By:
                    </Text>
                    <Text style={styles.selectedSort}>
                        {sortType === "default"
                            ? "Opening Status"
                            : "Most Popular"}
                    </Text>
                </Pressable>
            </View>

            {/* Modal display for sorting options */}
            <Modal
                visible={showSortModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowSortModal(false)}
            >
                <Pressable
                    style={styles.modalOverlay}
                    onPress={() => setShowSortModal(false)}
                >
                    <View style={styles.modalContent}>
                        <TouchableOpacity
                            style={[
                                styles.sortOption,
                                sortType === "default" && styles.selectedOption,
                            ]}
                            onPress={() => {
                                setSortType("default");
                                setShowSortModal(false);
                            }}
                        >
                            <Text
                                style={[
                                    styles.sortOptionText,
                                    sortType === "default" &&
                                        styles.selectedOptionText,
                                ]}
                            >
                                Opening Status
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.sortOption,
                                sortType === "popularity" &&
                                    styles.selectedOption,
                            ]}
                            onPress={() => {
                                setSortType("popularity");
                                setShowSortModal(false);
                            }}
                        >
                            <Text
                                style={[
                                    styles.sortOptionText,
                                    sortType === "popularity" &&
                                        styles.selectedOptionText,
                                ]}
                            >
                                Most Popular
                            </Text>
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </Modal>

            {loading ? (
                <ActivityIndicator size="large" color="#00BFA6" />
            ) : (
                <FlatList
                    data={restaurants}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.list}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
    },
    notificationContainer: {
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    notificationButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F0F9F6",
        borderWidth: 1,
        borderColor: "#00BFA6",
        borderRadius: 8,
        padding: 12,
    },
    notificationText: {
        marginLeft: 8,
        color: "#00BFA6",
        fontWeight: "600",
        fontSize: 14,
    },
    list: {
        padding: 10,
    },
    filterSection: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
    },
    sortButton: {
        backgroundColor: "#f5f5f5",
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    sortButtonText: {
        fontSize: 14,
        color: "#666",
    },
    selectedSort: {
        fontSize: 16,
        color: "#333",
        fontWeight: "bold",
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.4)",
        justifyContent: "center",
        alignItems: "center",
    },
    modalContent: {
        backgroundColor: "#fff",
        borderRadius: 20,
        padding: 16,
        width: "80%",
        maxWidth: 300,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    sortOption: {
        paddingVertical: 12,
    },
    selectedOption: {
        backgroundColor: "#f0f8ff",
    },
    sortOptionText: {
        fontSize: 16,
        color: "#333",
    },
    selectedOptionText: {
        color: "#007AFF",
        fontWeight: "600",
    },
    restaurantItem: {
        backgroundColor: "#f0f0f0",
        padding: 15,
        marginVertical: 5,
        borderRadius: 8,
        alignItems: "center",
    },
    disabledItem: {
        opacity: 0.5,
    },
    imageContainer: {
        width: "100%",
        height: 150,
        position: "relative",
        justifyContent: "center",
        alignItems: "center",
    },
    restaurantImage: {
        width: "100%",
        height: 150,
        borderRadius: 8,
    },
    busyOverlay: {
        position: "absolute",
        width: "70%",
        height: "70%",
        borderRadius: 8,
    },
    restaurantName: {
        fontSize: 20,
        fontWeight: "bold",
        marginTop: 10,
    },
    restaurantDescription: {
        fontSize: 14,
        color: "#555",
        textAlign: "center",
        marginTop: 5,
    },
    infoContainer: {
        width: "100%",
        alignItems: "center",
    },
    popularityContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 5,
        gap: 4,
    },
    starIcon: {
        width: 16,
        height: 16,
        tintColor: "#FFB800",
        opacity: 0.5,
        marginRight: 4,
    },
    popularityText: {
        fontSize: 12,
        color: "#FFB800",
        opacity: 0.5,
    },
});

// Protect the component with role-based access for students
export default withRoleProtection(Index, ["student"]);
