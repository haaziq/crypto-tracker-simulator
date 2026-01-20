import React, { useMemo } from "react";
import { Canvas, Path, Skia, LinearGradient, vec, Line } from "@shopify/react-native-skia";
import { PricePoint } from "../../core/state/PriceHistoryManager";

/**
 * SkiaLineChart Component
 *
 * High-performance line chart using React Native Skia.
 * Renders price history with smooth lines and gradient fill.
 *
 * Features:
 * - GPU-accelerated rendering (60fps+)
 * - Smooth bezier curves
 * - Gradient fill under the line
 * - Auto-scaling to fit data
 * - Grid lines for readability
 *
 * Performance:
 * - Runs on separate thread (doesn't block JS)
 * - Can handle hundreds of points at 60fps
 */

interface SkiaLineChartProps {
  data: PricePoint[];
  width: number;
  height: number;
  strokeColor: string;
  gradientStartColor: string;
  gradientEndColor: string;
  backgroundColor?: string;
}

export const SkiaLineChart = ({
  data,
  width,
  height,
  strokeColor,
  gradientStartColor,
  gradientEndColor,
  backgroundColor = "#1F2937",
}: SkiaLineChartProps) => {
  // Calculate chart paths
  const { linePath, fillPath, minPrice, maxPrice } = useMemo(() => {
    if (data.length === 0) {
      return {
        linePath: null,
        fillPath: null,
        minPrice: 0,
        maxPrice: 0,
      };
    }

    // Find min/max for scaling
    const prices = data.map((p) => p.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1; // Avoid division by zero

    // Add 5% padding to top and bottom
    const padding = range * 0.05;
    const scaledMin = min - padding;
    const scaledMax = max + padding;
    const scaledRange = scaledMax - scaledMin;

    // Create path for the line
    const path = Skia.Path.Make();
    const fillPath = Skia.Path.Make();

    // Calculate points
    const points = data.map((point, index) => {
      const x = (index / (data.length - 1)) * width;
      const normalizedPrice = (point.price - scaledMin) / scaledRange;
      const y = height - normalizedPrice * height; // Flip Y axis (0 at top)

      return { x, y };
    });

    // Draw line path
    if (points.length > 0) {
      path.moveTo(points[0].x, points[0].y);

      // Use smooth curves for better visual appeal
      for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1];
        const curr = points[i];

        // Simple smooth curve using quadratic bezier
        if (i === 1) {
          path.lineTo(curr.x, curr.y);
        } else {
          const midX = (prev.x + curr.x) / 2;
          path.quadTo(prev.x, prev.y, midX, (prev.y + curr.y) / 2);
          if (i === points.length - 1) {
            path.lineTo(curr.x, curr.y);
          }
        }
      }

      // Create fill path (same as line but closed to bottom)
      fillPath.addPath(path);
      fillPath.lineTo(points[points.length - 1].x, height);
      fillPath.lineTo(points[0].x, height);
      fillPath.close();
    }

    return {
      linePath: path,
      fillPath,
      minPrice: min,
      maxPrice: max,
    };
  }, [data, width, height]);

  // Don't render if no data
  if (!linePath || !fillPath || data.length === 0) {
    return (
      <Canvas style={{ width, height, backgroundColor }}>
        {/* Empty canvas */}
      </Canvas>
    );
  }

  return (
    <Canvas style={{ width, height, backgroundColor }}>
      {/* Grid lines (optional) */}
      <Line
        p1={vec(0, height / 4)}
        p2={vec(width, height / 4)}
        color="rgba(255, 255, 255, 0.05)"
        style="stroke"
        strokeWidth={1}
      />
      <Line
        p1={vec(0, height / 2)}
        p2={vec(width, height / 2)}
        color="rgba(255, 255, 255, 0.05)"
        style="stroke"
        strokeWidth={1}
      />
      <Line
        p1={vec(0, (3 * height) / 4)}
        p2={vec(width, (3 * height) / 4)}
        color="rgba(255, 255, 255, 0.05)"
        style="stroke"
        strokeWidth={1}
      />

      {/* Gradient fill under line */}
      <Path path={fillPath} style="fill">
        <LinearGradient
          start={vec(0, 0)}
          end={vec(0, height)}
          colors={[gradientStartColor, gradientEndColor]}
        />
      </Path>

      {/* Line stroke */}
      <Path
        path={linePath}
        style="stroke"
        strokeWidth={2}
        color={strokeColor}
        strokeCap="round"
        strokeJoin="round"
      />
    </Canvas>
  );
};
