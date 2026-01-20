import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
} from "react-native";
import { useAtom } from "jotai";
import {
  selectedSymbolsAtom,
  updateFrequencyAtom,
  allCryptosAtom,
} from "../../core/state/atoms/cryptoAtoms";
import { WebSocketManager } from "../../core/networking/WebSocketManager";

/**
 * FilterPanel Component
 *
 * Allows user to:
 * - Select which cryptocurrencies to display
 * - Change update frequency (10Hz, 20Hz, 30Hz)
 * - Apply filters to server
 *
 * This demonstrates bidirectional WebSocket communication.
 */

export const FilterPanel = () => {
  const [allCryptos] = useAtom(allCryptosAtom);
  const [selectedSymbols, setSelectedSymbols] = useAtom(selectedSymbolsAtom);
  const [frequency, setFrequency] = useAtom(updateFrequencyAtom);

  const wsManager = WebSocketManager.getInstance();

  /**
   * Toggle symbol selection
   */
  const toggleSymbol = (symbol: string) => {
    setSelectedSymbols((prev) => {
      if (prev.includes(symbol)) {
        // Remove from selection
        return prev.filter((s) => s !== symbol);
      } else {
        // Add to selection
        return [...prev, symbol];
      }
    });
  };

  /**
   * Apply filter to server
   */
  const applyFilter = () => {
    wsManager.sendFilterCommand(selectedSymbols);
    console.log("Filter applied:", selectedSymbols);
  };

  /**
   * Change update frequency
   */
  const changeFrequency = (newFrequency: 10 | 20 | 30) => {
    setFrequency(newFrequency);
    wsManager.sendFrequencyCommand(newFrequency);
    console.log("Frequency changed:", newFrequency);
  };

  /**
   * Select all / clear all
   */
  const selectAll = () => {
    const allSymbols = allCryptos.map((c) => c.symbol);
    setSelectedSymbols(allSymbols);
  };

  const clearAll = () => {
    setSelectedSymbols([]);
  };

  return (
    <View style={styles.panel}>
      <Text style={styles.title}>Filter & Settings</Text>

      {/* Frequency Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Update Frequency</Text>

        <View style={styles.frequencyButtons}>
          <FrequencyButton
            label="10 Hz"
            active={frequency === 10}
            onPress={() => changeFrequency(10)}
          />
          <FrequencyButton
            label="20 Hz"
            active={frequency === 20}
            onPress={() => changeFrequency(20)}
          />
          <FrequencyButton
            label="30 Hz"
            active={frequency === 30}
            onPress={() => changeFrequency(30)}
          />
        </View>
      </View>

      {/* Crypto Selection */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Select Cryptocurrencies</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity onPress={selectAll}>
              <Text style={styles.quickActionText}>All</Text>
            </TouchableOpacity>
            <Text style={styles.separator}>|</Text>
            <TouchableOpacity onPress={clearAll}>
              <Text style={styles.quickActionText}>None</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.helpText}>
          {selectedSymbols.length === 0
            ? "All cryptocurrencies shown"
            : `${selectedSymbols.length} selected`}
        </Text>

        <ScrollView style={styles.symbolList}>
          {allCryptos.map((crypto) => (
            <View key={crypto.symbol} style={styles.symbolRow}>
              <View style={styles.symbolInfo}>
                <Text style={styles.symbolText}>{crypto.symbol}</Text>
                <Text style={styles.nameText}>{crypto.name}</Text>
              </View>

              <Switch
                value={selectedSymbols.includes(crypto.symbol)}
                onValueChange={() => toggleSymbol(crypto.symbol)}
                trackColor={{ false: "#374151", true: "#3B82F6" }}
                thumbColor="#F9FAFB"
              />
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Apply Button */}
      <TouchableOpacity style={styles.applyButton} onPress={applyFilter}>
        <Text style={styles.applyButtonText}>Apply Filter</Text>
      </TouchableOpacity>
    </View>
  );
};

/**
 * FrequencyButton Component
 */
interface FrequencyButtonProps {
  label: string;
  active: boolean;
  onPress: () => void;
}

const FrequencyButton = ({ label, active, onPress }: FrequencyButtonProps) => (
  <TouchableOpacity
    style={[styles.frequencyButton, active && styles.frequencyButtonActive]}
    onPress={onPress}
  >
    <Text
      style={[
        styles.frequencyButtonText,
        active && styles.frequencyButtonTextActive,
      ]}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  panel: {
    flex: 1,
    backgroundColor: "#1F2937",
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#F9FAFB",
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#D1D5DB",
  },
  quickActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  quickActionText: {
    fontSize: 14,
    color: "#3B82F6",
    fontWeight: "500",
  },
  separator: {
    fontSize: 14,
    color: "#6B7280",
    marginHorizontal: 8,
  },
  helpText: {
    fontSize: 14,
    color: "#9CA3AF",
    marginBottom: 12,
  },
  frequencyButtons: {
    flexDirection: "row",
    gap: 12,
  },
  frequencyButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#374151",
    alignItems: "center",
  },
  frequencyButtonActive: {
    backgroundColor: "#3B82F6",
  },
  frequencyButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#9CA3AF",
  },
  frequencyButtonTextActive: {
    color: "#FFFFFF",
  },
  symbolList: {
    maxHeight: 400,
  },
  symbolRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#374151",
  },
  symbolInfo: {
    flex: 1,
  },
  symbolText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#F9FAFB",
  },
  nameText: {
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 2,
  },
  applyButton: {
    backgroundColor: "#3B82F6",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 16,
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
});