import { Menu } from "react-admin";
import MapIcon from "@mui/icons-material/Map";

export const MyMenu = () => (
  <Menu>
    <Menu.DashboardItem />
    <Menu.ResourceItems />
    <Menu.Item
      to="/map"
      primaryText="Deployed Machines"
      leftIcon={<MapIcon />}
    />
  </Menu>
);
