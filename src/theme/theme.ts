// src/theme/theme.ts

import { TextStyle, ViewStyle, ImageStyle, ColorValue } from 'react-native';

// --- Custom Theme Definition ---
export interface CustomColors {
  // Selection colors for message selection mode
  selection: ColorValue;
  
  // Background colors
  background1: string;
  background2: string;
  background3: string; // Added for disabled states
  backgroundElevated: string;
  
  // Text colors
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textDanger: string;
  
  // Border colors
  borderHighlight: string;
  borderLight: string;
  borderDefault: string;
  
  // Primary colors
  primary: string;
  primaryLight: string;
  primaryDark: string; // Added for hover/pressed states
  primaryButtonBackground: string;
  
  // Static colors
  staticWhite: string;
  staticBlack: string; // Added for consistent dark text
  
  // Status colors
  error: string;
  errorBackground: string;
  errorText: string;
  success: string;
  successBackground: string; // Added for success messages
  warning: string; // Added for warning states
  warningBackground: string; // Added for warning messages
  
  // Icon colors
  icon: string;
  iconSecondary: string;
  iconFaint: string;
  iconActive: string; // Added for active/pressed icon states
  
  // Additional UI colors
  overlay: string; // Added for modal overlays
  shadow: string; // Added for shadow colors
  divider: string; // Added for divider lines
  placeholder: string; // Added for placeholder text
  disabled: string; // Added for disabled states
  
  // Chat-specific colors
  messageBackground: string; // Added for message bubbles
  messageBackgroundOwn: string; // Added for own message bubbles
  messageBorder: string; // Added for message borders
  
  // Status indicator colors
  online: string;
  offline: string;
  away: string;
  busy: string;
}

export const customThemeColorsLight: CustomColors = {
  // Selection colors
  selection: 'rgba(115, 103, 240, 0.2)',
  
  // Background colors
  background1: '#FFFFFF',
  background2: '#F8FAFC',
  background3: '#F1F5F9',
  backgroundElevated: '#FFFFFF',
  
  // Text colors
  textPrimary: '#1E293B',
  textSecondary: '#64748B',
  textTertiary: '#94A3B8',
  textDanger: '#DC2626',
  
  // Border colors
  borderHighlight: '#7367F0',
  borderLight: '#E2E8F0',
  borderDefault: '#CBD5E1',
  
  // Primary colors
  primary: '#7367F0',
  primaryLight: '#A78BFA',
  primaryDark: '#5B21B6',
  primaryButtonBackground: '#7367F0',
  
  // Static colors
  staticWhite: '#FFFFFF',
  staticBlack: '#000000',
  
  // Status colors
  error: '#DC2626',
  errorBackground: '#FEF2F2',
  errorText: '#DC2626',
  success: '#059669',
  successBackground: '#ECFDF5',
  warning: '#D97706',
  warningBackground: '#FFFBEB',
  
  // Icon colors
  icon: '#64748B',
  iconSecondary: '#94A3B8',
  iconFaint: '#CBD5E1',
  iconActive: '#7367F0',
  
  // Additional UI colors
  overlay: 'rgba(0, 0, 0, 0.5)',
  shadow: 'rgba(0, 0, 0, 0.1)',
  divider: '#E2E8F0',
  placeholder: '#94A3B8',
  disabled: '#F1F5F9',
  
  // Chat-specific colors
  messageBackground: '#F8FAFC',
  messageBackgroundOwn: '#7367F0',
  messageBorder: '#E2E8F0',
  
  // Status indicator colors
  online: '#10B981',
  offline: '#6B7280',
  away: '#F59E0B',
  busy: '#EF4444',
};

export const customThemeColorsDark: CustomColors = {
  // Selection colors
  selection: 'rgba(187, 134, 252, 0.2)',
  
  // Background colors
  background1: '#0F172A',
  background2: '#1E293B',
  background3: '#334155',
  backgroundElevated: '#1E293B',
  
  // Text colors
  textPrimary: '#F8FAFC',
  textSecondary: '#CBD5E1',
  textTertiary: '#94A3B8',
  textDanger: '#F87171',
  
  // Border colors
  borderHighlight: '#BB86FC',
  borderLight: '#334155',
  borderDefault: '#475569',
  
  // Primary colors
  primary: '#BB86FC',
  primaryLight: '#DDD6FE',
  primaryDark: '#7C3AED',
  primaryButtonBackground: '#BB86FC',
  
  // Static colors
  staticWhite: '#FFFFFF',
  staticBlack: '#000000',
  
  // Status colors
  error: '#F87171',
  errorBackground: '#374151',
  errorText: '#F87171',
  success: '#34D399',
  successBackground: '#064E3B',
  warning: '#FBBF24',
  warningBackground: '#451A03',
  
  // Icon colors
  icon: '#CBD5E1',
  iconSecondary: '#94A3B8',
  iconFaint: '#64748B',
  iconActive: '#BB86FC',
  
  // Additional UI colors
  overlay: 'rgba(0, 0, 0, 0.7)',
  shadow: 'rgba(0, 0, 0, 0.3)',
  divider: '#334155',
  placeholder: '#64748B',
  disabled: '#334155',
  
  // Chat-specific colors
  messageBackground: '#1E293B',
  messageBackgroundOwn: '#BB86FC',
  messageBorder: '#334155',
  
  // Status indicator colors
  online: '#10B981',
  offline: '#6B7280',
  away: '#F59E0B',
  busy: '#EF4444',
};

// Typography interfaces and definitions
export interface TypographyStyle {
  fontSize: number;
  fontWeight?: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
  lineHeight?: number;
  letterSpacing?: number;
}

export interface CustomTypography {
  // Headings
  heading1: { bold: TypographyStyle; medium: TypographyStyle };
  heading2: { bold: TypographyStyle; medium: TypographyStyle };
  heading3: { bold: TypographyStyle; medium: TypographyStyle };
  heading4: { bold: TypographyStyle; medium: TypographyStyle };
  
  // Titles
  title1: TypographyStyle;
  title2: TypographyStyle;
  title3: TypographyStyle;
  
  // Body text
  body: { 
    regular: TypographyStyle; 
    medium: TypographyStyle; 
    bold: TypographyStyle;
    large: TypographyStyle;
  };
  
  // Captions and small text
  caption1: { 
    regular: TypographyStyle; 
    medium: TypographyStyle; 
    bold: TypographyStyle; 
  };
  caption2: { 
    regular: TypographyStyle; 
    medium: TypographyStyle; 
  };
  
  // Buttons
  button: { 
    medium: TypographyStyle; 
    bold: TypographyStyle;
    large: TypographyStyle;
  };
  
  // Special use cases
  overline: TypographyStyle;
  subtitle1: TypographyStyle;
  subtitle2: TypographyStyle;
}

export const customTypography: CustomTypography = {
  // Headings
  heading1: { 
    bold: { fontSize: 32, fontWeight: 'bold', lineHeight: 40 },
    medium: { fontSize: 32, fontWeight: '600', lineHeight: 40 }
  },
  heading2: { 
    bold: { fontSize: 28, fontWeight: 'bold', lineHeight: 36 },
    medium: { fontSize: 28, fontWeight: '600', lineHeight: 36 }
  },
  heading3: { 
    bold: { fontSize: 24, fontWeight: 'bold', lineHeight: 32 },
    medium: { fontSize: 24, fontWeight: '600', lineHeight: 32 }
  },
  heading4: { 
    bold: { fontSize: 20, fontWeight: 'bold', lineHeight: 28 },
    medium: { fontSize: 20, fontWeight: '600', lineHeight: 28 }
  },
  
  // Titles
  title1: { fontSize: 22, fontWeight: '600', lineHeight: 30 },
  title2: { fontSize: 18, fontWeight: '600', lineHeight: 26 },
  title3: { fontSize: 16, fontWeight: '600', lineHeight: 24 },
  
  // Body text
  body: {
    large: { fontSize: 16, fontWeight: 'normal', lineHeight: 24 },
    regular: { fontSize: 14, fontWeight: 'normal', lineHeight: 22 },
    medium: { fontSize: 14, fontWeight: '500', lineHeight: 22 },
    bold: { fontSize: 14, fontWeight: 'bold', lineHeight: 22 },
  },
  
  // Captions
  caption1: {
    regular: { fontSize: 12, fontWeight: 'normal', lineHeight: 18 },
    medium: { fontSize: 12, fontWeight: '500', lineHeight: 18 },
    bold: { fontSize: 12, fontWeight: 'bold', lineHeight: 18 },
  },
  caption2: {
    regular: { fontSize: 10, fontWeight: 'normal', lineHeight: 16 },
    medium: { fontSize: 10, fontWeight: '500', lineHeight: 16 },
  },
  
  // Buttons
  button: {
    medium: { fontSize: 16, fontWeight: '500', lineHeight: 24 },
    bold: { fontSize: 16, fontWeight: 'bold', lineHeight: 24 },
    large: { fontSize: 18, fontWeight: '600', lineHeight: 26 },
  },
  
  // Special cases
  overline: { fontSize: 10, fontWeight: '500', lineHeight: 16, letterSpacing: 1.5 },
  subtitle1: { fontSize: 16, fontWeight: '500', lineHeight: 24 },
  subtitle2: { fontSize: 14, fontWeight: '500', lineHeight: 22 },
};

// Spacing system
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

// Border radius system
export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

// Shadow system
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
};

// Animation durations
export const animations = {
  fast: 150,
  normal: 300,
  slow: 500,
  verySlow: 1000,
};

// Styles for AppErrorBoundary
export const createAppBoundaryStyles = (theme: CustomColors) => ({
  container: {
    flex: 1,
    backgroundColor: theme.background2,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  } as ViewStyle,
  card: {
    backgroundColor: theme.background1,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    ...shadows.lg,
    width: '100%',
    maxWidth: 400,
  } as ViewStyle,
  title: {
    ...customTypography.heading3.bold,
    marginBottom: spacing.sm,
    color: theme.textPrimary,
  } as TextStyle,
  errorText: {
    ...customTypography.body.regular,
    textAlign: 'center',
    color: theme.textSecondary,
    marginBottom: spacing.md,
  } as TextStyle,
  buttonContainer: {
    width: '100%',
  } as ViewStyle,
});

// Global App Styles
export const createAppGlobalStyles = (theme: CustomColors) => ({
  safeArea: {
    flex: 1,
    backgroundColor: theme.background1,
  } as ViewStyle,
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.background1,
  } as ViewStyle,
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  cardContainer: {
    backgroundColor: theme.background1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    margin: spacing.md,
    ...shadows.md,
  } as ViewStyle,
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.divider,
  } as ViewStyle,
});

// Chat-specific styles
export const createChatStyles = (theme: CustomColors) => ({
  messageContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  } as ViewStyle,
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.lg,
  } as ViewStyle,
  ownMessageBubble: {
    backgroundColor: theme.messageBackgroundOwn,
    alignSelf: 'flex-end',
    borderBottomRightRadius: borderRadius.xs,
  } as ViewStyle,
  otherMessageBubble: {
    backgroundColor: theme.messageBackground,
    alignSelf: 'flex-start',
    borderBottomLeftRadius: borderRadius.xs,
  } as ViewStyle,
  messageText: {
    ...customTypography.body.regular,
  } as TextStyle,
  ownMessageText: {
    color: theme.staticWhite,
  } as TextStyle,
  otherMessageText: {
    color: theme.textPrimary,
  } as TextStyle,
  timestamp: {
    ...customTypography.caption2.regular,
    color: theme.textTertiary,
    marginTop: spacing.xs,
  } as TextStyle,
});

// Utility function for status bar content
export const getAppStatusBarContent = (
  colorScheme: 'light' | 'dark' | null | undefined
): 'default' | 'light-content' | 'dark-content' => {
  return colorScheme === 'dark' ? 'light-content' : 'dark-content';
};

// Utility function to get theme colors based on color scheme
export const getThemeColors = (
  colorScheme: 'light' | 'dark' | null | undefined
): CustomColors => {
  return colorScheme === 'dark' ? customThemeColorsDark : customThemeColorsLight;
};

// Helper function to create themed styles
export const createThemedStyles = <T extends Record<string, any>>(
  styleCreator: (theme: CustomColors) => T
) => {
  return (colorScheme: 'light' | 'dark' | null | undefined) => {
    const theme = getThemeColors(colorScheme);
    return styleCreator(theme);
  };
};

// Export StyleSheet for convenience
import { StyleSheet } from 'react-native';
export { StyleSheet };

// Default export
export default {
  customThemeColorsLight,
  customThemeColorsDark,
  customTypography,
  spacing,
  borderRadius,
  shadows,
  animations,
  getThemeColors,
  getAppStatusBarContent,
  createThemedStyles,
};