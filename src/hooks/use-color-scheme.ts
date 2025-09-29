/**
 * Color scheme hook for theme management
 */

import { useColorScheme as useNativeColorScheme } from 'react-native';

export function useColorScheme() {
  return useNativeColorScheme();
}