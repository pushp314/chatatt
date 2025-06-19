import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import AppErrorBoundary from './AppErrorBoundary';
// ActiveChatProvider and AuthProvider are no longer needed here

// Global Error Handling (remains the same)
if (global?.ErrorUtils) {
  const defaultHandler = global.ErrorUtils.getGlobalHandler();

  function globalErrorHandler(error, isFatal) {
    console.log(
      '[GlobalErrorHandler]:',
      isFatal ? 'Fatal:' : 'Non-Fatal:',
      error,
    );
    defaultHandler?.(error, isFatal);
  }

  global.ErrorUtils.setGlobalHandler(globalErrorHandler);
}

if (typeof process === 'object' && process.on) {
  process.on('unhandledRejection', (reason, promise) => {
    console.log('[Unhandled Promise Rejection]:', reason);
  });
}
// End Global Error Handling

const Root = () => (
  <AppErrorBoundary>
    <App />
  </AppErrorBoundary>
);

AppRegistry.registerComponent(appName, () => Root);