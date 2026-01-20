import React, { memo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useAtom } from "jotai";
import { cryptoAtomFamily } from "../../core/state/atoms/cryptoAtoms";

/**
 * CryptoCard Component
 *
 * Displays a single cryptocurrency with:
 * - Symbol and name
 * - Current price
 * - 24h price change (with color coding)
 *
 * Performance optimized:
 * - Uses Jotai atom family (only re-renders when THIS crypto changes)
 * - Wrapped in React.memo
 * - Custom comparison function
 *
 * Usage:
 *   <CryptoCard symbol="BTC" />
 */

interface CryptoCardProps {
  symbol: string;
}

export const CryptoCard = memo(
  ({ symbol }: CryptoCardProps) => {
    // Subscribe to this specific crypto's atom
    const [crypto] = useAtom(cryptoAtomFamily(symbol));

    // Handle loading state (crypto not yet received)
    if (!crypto) {
      return (
        <View style={styles.card}>
          <Text style={styles.symbol}>{symbol}</Text>
          <Text style={styles.loading}>Loading...</Text>
        </View>
      );
    }

    // Destructure view model (plain object!)
    const { name, price, priceChange24h } = crypto;

    // Color coding based on price change
    const changeColor = priceChange24h >= 0 ? "#10B981" : "#EF4444"; // Green or Red
    const changeIcon = priceChange24h >= 0 ? "▲" : "▼";

    return (
      <View style={styles.card}>
        {/* Symbol and Name */}
        <View style={styles.header}>
          <Text style={styles.symbol}>{symbol}</Text>
          <Text style={styles.name}>{name}</Text>
        </View>

        {/* Price */}
        <Text style={styles.price}>
          $
          {price.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </Text>

        {/* 24h Change */}
        <View style={styles.changeContainer}>
          <Text style={[styles.changeText, { color: changeColor }]}>
            {changeIcon} {Math.abs(priceChange24h).toFixed(2)}%
          </Text>
        </View>
      </View>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison: only re-render if symbol changes
    // (Crypto data changes handled by Jotai atom subscription)
    return prevProps.symbol === nextProps.symbol;
  }
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#1F2937",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#374151",
  },
  header: {
    marginBottom: 8,
  },
  symbol: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#F9FAFB",
    marginBottom: 2,
  },
  name: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  price: {
    fontSize: 24,
    fontWeight: "600",
    color: "#F9FAFB",
    marginVertical: 8,
  },
  changeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  changeText: {
    fontSize: 16,
    fontWeight: "500",
  },
  loading: {
    fontSize: 14,
    color: "#9CA3AF",
  },
});