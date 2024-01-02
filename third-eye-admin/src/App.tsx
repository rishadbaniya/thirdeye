import React, { useState, useEffect } from "react";
import { useStore } from "react-admin";
import { Admin, Resource, CustomRoutes } from "react-admin";
import restDataProvider from "./dataProvider";
import { authProvider } from "./auth/authProvider";
import LogIn from "./auth/LogIn";
import themes from "./themes/themes";
import { Route } from "react-router-dom";
import NepalMap from "./map";
import { MyLayout } from "./MyLayout";
import { accessSync } from "fs";
import UserCreate from "./users/UserCreate";
import UserEdit from "./users/UserEdit";
import UserList from "./users/UsersList";
import DeviceList from "./devices/DeviceList";
import DeviceCreate from "./devices/DeviceCreate";
import DeviceEdit from "./devices/DeviceEdit";
import { BarChart, LineChart } from "./visualizations";

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
        <Resource
          name="devices"
          list={DeviceList}
          create={DeviceCreate}
          edit={DeviceEdit}
        />
        <CustomRoutes>
          <Route path="/map" element={<NepalMap />} />
          <Route
            path="/bar"
            element={
              <BarChart
                chart_data={[
                  { quarter: 1, earnings: 13000 },
                  { quarter: 2, earnings: 16500 },
                  { quarter: 3, earnings: 14250 },
                  { quarter: 4, earnings: 19000 },
                ]}
                headers={["Header 1", "Header 2", "Header 3", "Header 4"]}
                x_label={"quarter"}
                y_label={"earnings"}
              />
            }
          />
          <Route
            path="/line"
            element={
              <LineChart
                chart_data={[
                  { x: 1, y: 13000 },
                  { x: 2, y: 16500 },
                  { x: 3, y: 14250 },
                  { x: 4, y: 19000 },
                ]}
                headers={["Header 1", "Header 2", "Header 3", "Header 4"]}
                x_label={"quarter"}
                y_label={"earnings"}
              />
            }
          />
        </CustomRoutes>
      </Admin>
    </>
  );
};
