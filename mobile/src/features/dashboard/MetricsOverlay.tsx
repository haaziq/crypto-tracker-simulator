import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useAtom } from "jotai";
import {
  performanceMetricsAtom,
  performanceStatusAtom,
  connectionStatusAtom,
  showMetricsOverlayAtom,
} from "../../core/state/atoms/cryptoAtoms";

/**
 * MetricsOverlay Component
 *
 * Displays real-time performance metrics in a semi-transparent overlay.
 *
 * Shows:
 * - Connection status
 * - Latency (P50, P95, P99) with pass/fail indicators
 * - Frame rate with pass/fail indicator
 * - Deserialization time with pass/fail indicator
 * - Data throughput
 * - Messages per second
 *
 * Color coding:
 * - Green: Meeting target
 * - Red: Failing target
 * - Yellow: Warning zone
 */

export const MetricsOverlay = () => {
  const [metrics] = useAtom(performanceMetricsAtom);
  const [status] = useAtom(performanceStatusAtom);
  const [connectionStatus] = useAtom(connectionStatusAtom);
  const [showOverlay, setShowOverlay] = useAtom(showMetricsOverlayAtom);

  // Toggle visibility
  if (!showOverlay) {
    return (
      <TouchableOpacity
        style={styles.showButton}
        onPress={() => setShowOverlay(true)}
      >
        <Text style={styles.showButtonText}>Show Metrics</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.overlay}>
      {/* Header with close button */}
      <View style={styles.header}>
        <Text style={styles.title}>Performance Metrics</Text>
        <TouchableOpacity onPress={() => setShowOverlay(false)}>
          <Text style={styles.closeButton}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Connection Status */}
      <MetricRow
        label="Connection"
        value={connectionStatus}
        status={connectionStatus === "CONNECTED" ? "pass" : "fail"}
      />

      {/* Latency Metrics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Latency (ms)</Text>

        <MetricRow
          label="P50 (Median)"
          value={metrics.latencyP50.toFixed(0)}
          status="info"
        />

        <MetricRow
          label="P95"
          value={metrics.latencyP95.toFixed(0)}
          status="info"
        />

        <MetricRow
          label="P99"
          value={metrics.latencyP99.toFixed(0)}
          target="< 300ms"
          status={status.latencyOk ? "pass" : "fail"}
        />

        <MetricRow
          label="Average"
          value={metrics.averageLatency.toFixed(0)}
          status="info"
        />
      </View>

      {/* Frame Rate */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Rendering</Text>

        <MetricRow
          label="Frame Rate"
          value={`${metrics.currentFrameRate.toFixed(0)} fps`}
          target="≥ 60 fps"
          status={status.frameRateOk ? "pass" : "fail"}
        />

        <MetricRow
          label="Frame Drops"
          value={`${metrics.frameDropPercentage.toFixed(1)}%`}
          status="info"
        />
      </View>

      {/* Deserialization */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Deserialization</Text>

        <MetricRow
          label="Average Time"
          value={`${metrics.averageDeserializeTime.toFixed(2)} ms`}
          target="< 10ms"
          status={status.deserializeOk ? "pass" : "fail"}
        />

        <MetricRow
          label="Max Time"
          value={`${metrics.maxDeserializeTime.toFixed(2)} ms`}
          status="info"
        />
      </View>

      {/* Throughput */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Throughput</Text>

        <MetricRow
          label="Messages/sec"
          value={metrics.messagesPerSecond.toFixed(1)}
          status="info"
        />

        <MetricRow
          label="Data Rate"
          value={`${(metrics.bytesPerSecond / 1024).toFixed(1)} KB/s`}
          status="info"
        />

        <MetricRow
          label="Total Messages"
          value={metrics.messagesReceived.toString()}
          status="info"
        />
      </View>

      {/* Overall Status */}
      <View style={styles.statusContainer}>
        <Text
          style={[
            styles.overallStatus,
            { color: status.allOk ? "#10B981" : "#EF4444" },
          ]}
        >
          {status.allOk ? "✓ All Targets Met" : "✗ Performance Issues"}
        </Text>
      </View>
    </View>
  );
};

/**
 * MetricRow Component
 *
 * Single row showing a metric with optional target and status indicator
 */
interface MetricRowProps {
  label: string;
  value: string;
  target?: string;
  status: "pass" | "fail" | "info";
}

const MetricRow = ({ label, value, target, status }: MetricRowProps) => {
  const getStatusColor = () => {
    switch (status) {
      case "pass":
        return "#10B981"; // Green
      case "fail":
        return "#EF4444"; // Red
      case "info":
        return "#9CA3AF"; // Gray
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case "pass":
        return "✓";
      case "fail":
        return "✗";
      case "info":
        return "";
    }
  };

  return (
    <View style={styles.metricRow}>
      <View style={styles.metricLabel}>
        <Text style={styles.labelText}>{label}</Text>
        {target && <Text style={styles.targetText}>{target}</Text>}
      </View>

      <View style={styles.metricValue}>
        <Text style={[styles.valueText, { color: getStatusColor() }]}>
          {value}
        </Text>
        {status !== "info" && (
          <Text style={[styles.statusIcon, { color: getStatusColor() }]}>
            {getStatusIcon()}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 40,
    right: 16,
    width: 320,
    backgroundColor: "rgba(17, 24, 39, 0.95)",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#374151",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#F9FAFB",
  },
  closeButton: {
    fontSize: 24,
    color: "#9CA3AF",
    padding: 4,
  },
  section: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#374151",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#D1D5DB",
    marginBottom: 8,
  },
  metricRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  metricLabel: {
    flex: 1,
  },
  labelText: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  targetText: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 2,
  },
  metricValue: {
    flexDirection: "row",
    alignItems: "center",
  },
  valueText: {
    fontSize: 14,
    fontWeight: "600",
    marginRight: 8,
  },
  statusIcon: {
    fontSize: 16,
    fontWeight: "bold",
  },
  statusContainer: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#374151",
  },
  overallStatus: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  showButton: {
    position: "absolute",
    top: 40,
    right: 16,
    backgroundColor: "rgba(59, 130, 246, 0.9)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  showButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
});