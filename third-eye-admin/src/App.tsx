import React, { useState, useEffect } from "react";
import { useStore } from "react-admin";
import { Admin, Resource, CustomRoutes } from "react-admin";
import restDataProvider from "./dataProvider";
import UserList from "./users/UsersList";
import { Dashboard } from "./Dashboard";
import { authProvider } from "./auth/authProvider";
import LogIn from "./auth/LogIn";
import themes from "./themes/themes";
import UserCreate from "./users/UserCreate";
import { Route } from "react-router-dom";
import NepalMap from "./map";
import { MyLayout } from "./MyLayout";
import { accessSync } from "fs";
import UserEdit from "./users/UserEdit";

export const App = () => {
  const [dataProvider, udpateDataProvider] = useState();
  const [accessToken, setAccessToken] = useState(
    localStorage.getItem("access_token")
  );

  const [themeName] = useStore("themeName", "default");
  const lightTheme = themes.find((theme) => theme.name === themeName)?.light;
  const darkTheme = themes.find((theme) => theme.name === themeName)?.dark;

  const onLogin = () => {
    setAccessToken(localStorage.getItem("access_token"));
  };

  useEffect(() => {
    console.log("The access token is ", accessToken);
    let d = restDataProvider(accessToken!);
    //.then((d: any) => {
    udpateDataProvider(d);
    //});
  }, []);

  return (
    <>
      <Admin
        authProvider={authProvider}
        dataProvider={dataProvider!}
        loginPage={() => LogIn(onLogin)}
        dashboard={Dashboard}
        lightTheme={lightTheme}
        darkTheme={darkTheme}
        layout={MyLayout}
      >
        <Resource
          name="users"
          list={UserList}
          create={UserCreate}
          edit={UserEdit}
        />
        <Resource name="groups" list={UserList} />
        <CustomRoutes>
          <Route path="/map" element={<NepalMap />} />
        </CustomRoutes>
      </Admin>
    </>
  );
};
