import { useStore } from "react-admin";
import { Admin, Resource, CustomRoutes } from "react-admin";
import { dataProvider } from "./dataProvider";
import { UserList } from "./users";
import { Dashboard } from "./Dashboard";
import { authProvider } from "./auth/authProvider";
import Login from "./auth/Login";
import themes from "./themes/themes";
import { Route } from "react-router-dom";
import NepalMap from "./map";
import React from "react";
import { MyLayout } from "./MyLayout";

export const App = () => {
  const [themeName] = useStore("themeName", "default");
  const lightTheme = themes.find((theme) => theme.name === themeName)?.light;
  const darkTheme = themes.find((theme) => theme.name === themeName)?.dark;

  return (
    <Admin
      authProvider={authProvider}
      dataProvider={dataProvider}
      loginPage={Login}
      dashboard={Dashboard}
      lightTheme={lightTheme}
      darkTheme={darkTheme}
      layout={MyLayout}
    >
      <Resource name="groups" list={UserList} />
      <CustomRoutes>
        <Route path="/map" element={<NepalMap />} />
      </CustomRoutes>
    </Admin>
  );
};
