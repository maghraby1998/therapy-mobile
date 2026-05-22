import { DarkTheme } from '@react-navigation/native';
import { Platform } from 'react-native';

export const Colors = {
  background: '#120F2F',
  backgroundElevated: '#1A1642',
  surface: '#211B54',
  surfaceMuted: '#2A2368',
  primary: '#7C5CFF',
  primarySoft: '#9E8BFF',
  accent: '#4EC5F1',
  text: '#F5F7FF',
  textMuted: '#A9B0D0',
  border: '#3A3279',
  danger: '#FF7DA6',
  success: '#63E6BE',
  light: {
    text: '#120F2F',
    background: '#F5F7FF',
    icon: '#687091',
  },
  dark: {
    text: '#F5F7FF',
    background: '#120F2F',
    icon: '#A9B0D0',
  },
};

export const AppNavigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: Colors.background,
    card: Colors.backgroundElevated,
    primary: Colors.primary,
    text: Colors.text,
    border: Colors.border,
    notification: Colors.accent,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
