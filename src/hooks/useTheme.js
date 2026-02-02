import { useDark, useToggle } from '@vueuse/core';
import { watch } from 'vue';

// Define isDark outside to share state (singleton behavior)
const isDark = useDark();
const toggleDark = useToggle(isDark);

/**
 * Hook for managing theme (Dark/Light mode)
 * @returns {Object} { isDark, toggleDark, onThemeChange }
 */
export function useTheme() {
  
  /**
   * Register a callback to be called when theme changes
   * @param {Function} callback - Function receiving (isDark: boolean)
   */
  const onThemeChange = (callback) => {
    watch(isDark, (val) => {
      callback(val);
    });
  };

  return {
    isDark,
    toggleDark,
    onThemeChange
  };
}
