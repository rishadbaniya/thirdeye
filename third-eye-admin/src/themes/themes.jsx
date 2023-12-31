import {
  defaultLightTheme,
  defaultDarkTheme,
  nanoDarkTheme,
  nanoLightTheme,
  radiantDarkTheme,
  radiantLightTheme
} from "react-admin";

const themes = [
  { name: "default", light: defaultLightTheme, dark: defaultDarkTheme },
  { name: "nano", light: nanoLightTheme, dark: nanoDarkTheme },
  { name: "radiant", light: radiantLightTheme, dark: radiantDarkTheme }
];
export default themes;
