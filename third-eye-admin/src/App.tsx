import { useStore } from "react-admin";
import { Admin, Resource } from "react-admin";
import { dataProvider } from "./dataProvider";
import UserList from "./users/UsersList";
import { Dashboard } from "./Dashboard";
import { authProvider } from "./auth/authProvider";
import Login from "./auth/Login";
import themes from "./themes/themes";
import UserCreate from "./users/UserCreate";

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
    >
      <Resource name="users" list={UserList} create={UserCreate} />
    </Admin>
  );
}

      //<Resource name="groups" list={UserList} />
