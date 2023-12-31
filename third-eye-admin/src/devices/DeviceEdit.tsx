import {
  TextInput,
  Datagrid,
  Create,
  SimpleForm,
  required,
  RadioButtonGroupInput,
  useNotify,
  NumberInput,
  Edit,
  useRecordContext,
  useInput,
} from "react-admin";
import { SelectInput } from "react-admin";
import { Box } from "@mui/material";
import { ImageInput, ImageField } from "react-admin";
import React from "react";
import Button from "@mui/material/Button";

const DeviceEdit = (props) => {
  return (
    <Edit {...props}>
      <DeviceEditForm />
    </Edit>
  );
};
const DeviceEditForm = () => {
  const validateDeviceEdit = (values: DeviceCreateValues) => {
    const errors: DeviceCreateValues = {};
    if (!values.device_id) {
      errors.device_id = "Missing Device ID";
    }

    if (!values.address) {
      errors.address = "Missing Address";
    }

    return errors;
  };

  return (
    <Box width={"100%"}>
      <SimpleForm validate={validateDeviceEdit}>
        <Box display="flex" flexDirection="column" width="100%">
          <Box flex={1} ml={{ xs: 0, sm: "0.5em" }} mr={{ xs: 0, sm: "0.5em" }}>
            <TextInput
              variant="outlined"
              label="Device ID"
              source="device_id"
              isRequired
              fullWidth
            />
            <Box flex={1} display={"flex"} flexDirection="row">
              <Box mr="0.2em" flex={1}>
                <TextInput
                  variant="outlined"
                  label="Address"
                  source="address"
                  isRequired
                  fullWidth
                />
              </Box>
            </Box>
            <Box flex={1} display={"flex"} flexDirection="row">
              <TextInput
                variant="outlined"
                label="Latitude"
                source="latitude"
                fullWidth
              />
            </Box>
            <Box flex={1} display={"flex"} flexDirection="row">
              <TextInput
                variant="outlined"
                label="Longitude"
                source="longitude"
                fullWidth
              />
            </Box>
          </Box>
        </Box>
      </SimpleForm>
    </Box>
  );
};

export default DeviceEdit;
