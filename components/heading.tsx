import { ReactNode } from "react";
import { Text, TextProps, TextStyle } from "react-native";

export default function Heading({
    children,
    size,
    style,
    ...props
}: {
    children: ReactNode;
    size: number;
    style?: TextStyle;
} & TextProps) {
    const sizes = [32, 24, 18.72, 16, 13.28, 10.72];

    return (
        <Text
            style={[
                {
                    fontSize: sizes[size - 1],
                    fontWeight: 700,
                },
                style,
            ]}
            {...props}
        >
            {children}
        </Text>
    );
}
