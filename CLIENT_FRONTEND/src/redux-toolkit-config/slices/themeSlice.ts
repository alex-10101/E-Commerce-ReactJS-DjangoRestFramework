import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../store";

interface ThemeState {
  theme: string;
}

/**
 *
 * @returns The theme (light or dark) prefered by the user.
 * If the theme is saved in the browser's local storage, it defaults to that theme.
 * Otherwise, it defaults to the system defaults.
 *
 * NOTE: currently, some browser settings may override the system defaults settings.
 *
 * For example, in chromium based browsers (for example Chrome or Brave), if the appearance is set to dark,
 * window.matchMedia("(prefers-color-scheme: dark)").matches returns true even if
 * OS theme is set to light.
 * To get arround this issue, set the browser appearance to follow the OS theme,
 * and not some dark (or light) theme.
 *
 * For example, in Firefox some setting overrides the system defaults.
 */
function getUserPreferedTheme(): string {
  const savedTheme: string | null = localStorage.getItem("theme") as string;
  if (savedTheme === "light" || savedTheme === "dark") {
    return savedTheme;
  }
  // Fallback to system defaults
  if (
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    return "dark";
  } else {
    return "light";
  }
}

/**
 * The initial state is the theme prefered by the user.
 */
const initialState: ThemeState = {
  theme: getUserPreferedTheme(),
};

const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    /**
     * Sets the theme to the one prefered by the user (light or dark).
     * @param state
     * @param action
     */
    setTheme: (state, action: PayloadAction<string>) => {
      state.theme = action.payload;
    },

    /**
     * Changes the theme, from dark mode to light mode, or from light mode to dark mode.
     * @param state
     */
    toggleTheme: (state) => {
      if (state.theme === "light") {
        state.theme = "dark";
      } else {
        state.theme = "light";
      }
    },
  },
});

export const { setTheme, toggleTheme } = themeSlice.actions;

// Other code such as selectors can use the imported `RootState` type
export const selectTheme = (state: RootState) => state.theme.theme;

export default themeSlice.reducer;
