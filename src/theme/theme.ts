// src/theme/theme.ts

import { TextStyle, ViewStyle, ImageStyle, ColorValue } from 'react-native';

// --- Custom Theme Definition ---
export interface CustomColors {
  selection?: ColorValue;
  background1: string;
  background2: string;
  backgroundElevated: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  borderHighlight: string;
  borderLight: string;
  borderDefault: string;
  primaryLight: string;
  staticWhite: string;
  primary: string;
  primaryButtonBackground: string;
  error: string;
  errorBackground: string;
  errorText: string;
  iconSecondary: string;
  icon: string;
  iconFaint: string;
  textDanger?: string;
  success: string;
}

export const customThemeColorsLight: CustomColors = {
  selection: '#A6D9F7',
  background1: '#FFFFFF',
  background2: '#F0F0F0',
  backgroundElevated: '#FFFFFF',
  textPrimary: '#000000',
  textSecondary: '#5F5F5F',
  textTertiary: '#8E8E8E',
  borderHighlight: '#7367F0',
  borderLight: '#E0E0E0',
  borderDefault: '#BDBDBD',
  primaryLight: '#E9E7FD',
  staticWhite: '#FFFFFF',
  primary: '#7367F0',
  primaryButtonBackground: '#7367F0',
  error: '#C73C3E',
  errorBackground: '#FDECEC',
  errorText: '#C73C3E',
  textDanger: '#C73C3E',
  iconSecondary: '#757575',
  icon: '#5F5F5F',
  iconFaint: '#8E8E8E',
  success: '#28A745',
};

export const customThemeColorsDark: CustomColors = {
  selection: '#4A4A4A',
  background1: '#121212',
  background2: '#1E1E1E',
  backgroundElevated: '#2A2A2E',
  textPrimary: '#FFFFFF',
  textSecondary: '#A0A0A0',
  textTertiary: '#707070',
  borderHighlight: '#BB86FC',
  borderLight: '#424242',
  borderDefault: '#616161',
  primaryLight: '#3A2F6B',
  staticWhite: '#FFFFFF',
  primary: '#BB86FC',
  primaryButtonBackground: '#BB86FC',
  error: '#CF6679',
  errorBackground: '#382B2E',
  errorText: '#CF6679',
  textDanger: '#CF6679',
  iconSecondary: '#A0A0A0',
  icon: '#A0A0A0',
  iconFaint: '#707070',
  success: '#4CAF50',
};

export interface TypographyStyle {
  fontSize: number;
  fontWeight?: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
}

export interface CustomTypography {
  heading2: { bold: TypographyStyle };
  heading3: { bold: TypographyStyle };
  title2: TypographyStyle;
  title3: TypographyStyle;
  caption1: { medium: TypographyStyle; regular?: TypographyStyle; bold?: TypographyStyle };
  button: { medium: TypographyStyle; bold?: TypographyStyle };
  body: { regular: TypographyStyle; medium?: TypographyStyle; bold?: TypographyStyle };
}

export const customTypography: CustomTypography = {
  heading2: { bold: { fontSize: 24, fontWeight: 'bold' } },
  heading3: { bold: { fontSize: 20, fontWeight: 'bold' } },
  title2: { fontSize: 18, fontWeight: '600' },
  title3: { fontSize: 16, fontWeight: '600' },
  caption1: {
    medium: { fontSize: 12, fontWeight: '500' },
    regular: { fontSize: 12, fontWeight: 'normal' },
    bold: { fontSize: 12, fontWeight: 'bold' },
  },
  button: {
    medium: { fontSize: 16, fontWeight: '500' },
    bold: { fontSize: 16, fontWeight: 'bold' },
  },
  body: {
    regular: { fontSize: 14, fontWeight: 'normal' },
    medium: { fontSize: 14, fontWeight: '500' },
    bold: { fontSize: 14, fontWeight: 'bold' },
  },
};

// Styles for AppErrorBoundary (Example)
export const createAppBoundaryStyles = (theme: CustomColors) => ({
  container: {
    flex: 1,
    backgroundColor: theme.background2,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  } as ViewStyle,
  card: {
    backgroundColor: theme.background1,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: theme.textPrimary === '#FFFFFF' ? '#000000' : '#aaa',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    width: '100%',
    maxWidth: 400,
  } as ViewStyle,
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    color: theme.textPrimary,
  } as TextStyle,
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    color: theme.textSecondary,
    marginBottom: 20,
  } as TextStyle,
  buttonContainer: {
    width: '100%',
  } as ViewStyle,
});

// Global App Styles (Example)
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
});

export const getAppStatusBarContent = (colorScheme: 'light' | 'dark' | null | undefined): 'default' | 'light-content' | 'dark-content' => {
    return colorScheme === 'dark' ? 'light-content' : 'dark-content';
};
// REMOVED: Extra closing brace '}' was here