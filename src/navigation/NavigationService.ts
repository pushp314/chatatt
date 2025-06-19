import {createNavigationContainerRef} from '@react-navigation/native';
import {RootStackParamList} from './types'; // Ensure this path is correct

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

interface PendingNavigation {
  name: keyof RootStackParamList;
  // params?: RootStackParamList[PendingNavigation['name']]; // More type-safe params
  params?: any; // Kept as any for simplicity as in original
}

let pendingNavigation: PendingNavigation | null = null;

export function navigate<RouteName extends keyof RootStackParamList>(
  name: RouteName,
  // Uses conditional type to make params optional if undefined in ParamList
  params?: RootStackParamList[RouteName] extends undefined
    ? undefined
    : RootStackParamList[RouteName],
) {
  if (navigationRef.isReady()) {
    // The 'as any' casts are a common workaround but bypass some type safety.
    // Ideally, params type should align perfectly.
    navigationRef.navigate(name as any, params as any);
  } else {
    pendingNavigation = {name, params};
  }
}

export function processPendingNavigation() {
  if (pendingNavigation && navigationRef.isReady()) {
    const {name, params} = pendingNavigation;
    navigationRef.navigate(name as any, params as any); // Same as above
    pendingNavigation = null;
  }
}