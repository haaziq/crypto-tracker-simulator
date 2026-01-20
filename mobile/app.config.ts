import { ExpoConfig, ConfigContext } from "@expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Crypto Tracker",
  slug: "crypto-tracker",
  version: "1.0.0",
  orientation: "landscape", // Tablet landscape mode
  icon: "./assets/icon.png",
  userInterfaceStyle: "automatic",

  splash: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#000000",
  },

  // IMPORTANT: Environment variables
  extra: {
    eas: {
        "projectId": "74ea4636-737d-44e9-8fee-59f63c09604a"
      },
    // WebSocket server URL
    websocketUrl: process.env.WEBSOCKET_URL || "ws://localhost:8080",

    // Performance targets (from Hudl requirements)
    performanceTargets: {
      maxLatencyP99: 300, // milliseconds
      maxCommandLatency: 100, // milliseconds
      minFrameRate: 60, // fps
      maxDeserializeTime: 10, // milliseconds
    },

    // App environment
    env: process.env.APP_ENV || "development",
  },

  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.haaziq.crypto-tracker",
    infoPlist: {
      "ITSAppUsesNonExemptEncryption": false
    }
  },

  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#000000",
    },
    package: "com.haaziq.crypto-tracker",
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false
  },

  web: {
    favicon: "./assets/favicon.png",
  },

  plugins: ["expo-dev-client"],
});