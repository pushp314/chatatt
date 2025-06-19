import React from 'react';
import { View, Text, StyleSheet, Appearance, Button } from 'react-native';
// Assuming theme.ts is in src/theme/theme.ts or adjust path
import { customThemeColorsLight, customThemeColorsDark, createAppBoundaryStyles, CustomColors } from './src/theme/theme';

interface State {
  hasError: boolean;
  error: Error | null;
  colorScheme: 'light' | 'dark'; // No longer null, default to light
  currentTheme: CustomColors;
  styles: ReturnType<typeof createAppBoundaryStyles>;
}

interface Props {
  children: React.ReactNode;
}

class AppErrorBoundary extends React.Component<Props, State> {
  private appearanceListener: ReturnType<typeof Appearance.addChangeListener> | null = null;

  constructor(props: Props) {
    super(props);
    const systemScheme = Appearance.getColorScheme() ?? 'light';
    const currentTheme = systemScheme === 'dark' ? customThemeColorsDark : customThemeColorsLight;
    this.state = {
      hasError: false,
      error: null,
      colorScheme: systemScheme,
      currentTheme: currentTheme,
      styles: createAppBoundaryStyles(currentTheme),
    };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.log('ErrorBoundary caught an error', error, errorInfo);
    // Log error to an error reporting service here if needed.
  }

  componentDidMount() {
    this.appearanceListener = Appearance.addChangeListener(({ colorScheme }) => {
      const newScheme = colorScheme ?? 'light';
      const newTheme = newScheme === 'dark' ? customThemeColorsDark : customThemeColorsLight;
      this.setState({
        colorScheme: newScheme,
        currentTheme: newTheme,
        styles: createAppBoundaryStyles(newTheme),
      });
    });
  }

  componentWillUnmount() {
    if (this.appearanceListener) {
      this.appearanceListener.remove();
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const { styles, currentTheme } = this.state; // Use styles from state
      return (
        <View style={styles.container}>
          <View style={styles.card}>
            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.errorText}>
              {this.state.error ? this.state.error.toString() : 'Unknown error'}
            </Text>
            <View style={styles.buttonContainer}>
              <Button
                title="Retry"
                onPress={this.handleRetry}
                color={currentTheme.primary} // Use theme color for button
              />
            </View>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

export default AppErrorBoundary;