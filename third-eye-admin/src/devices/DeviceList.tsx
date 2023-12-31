import {
  InfiniteList,
  TextField,
  Datagrid,
  SearchInput,
  Count,
  List,
} from "react-admin";
import { Box } from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import React from "react";
import MaleIcon from "@mui/icons-material/Male";
import CorporateFareIcon from "@mui/icons-material/CorporateFare";
import { SavedQueriesList, FilterList, FilterListItem } from "react-admin";
import { Card, CardContent } from "@mui/material";

const DeviceList = () => {
  return (
    <Box width={"100%"}>
      <List>
        <Datagrid rowClick="edit" optimized>
          <TextField source="device_id" />
          <TextField source="address" />
        </Datagrid>
      </List>
    </Box>
  );
};

export default DeviceList;
