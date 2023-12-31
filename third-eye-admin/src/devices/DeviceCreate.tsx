import {
  List,
  TextInput,
  Datagrid,
  NumberField,
  Create,
  SimpleForm,
  required,
  RadioButtonGroupInput,
  useNotify,
  NumberInput,
} from "react-admin";
import { SelectInput } from "react-admin";
import { Box } from "@mui/material";
import { ImageInput, ImageField } from "react-admin";
import React, { useEffect, useState } from "react";

//import {uploadImage} from '../utils';

const DeviceCreate = () => {
  const validateDeviceCreation = (values: DeviceCreateValues) => {
    const errors: DeviceCreateValues = {};
    if (!values.device_id) {
      errors.device_id = "Missing Device ID";
    }

    if (!values.address) {
      errors.address = "Missing Address";
    }

    if (!values.longitude) {
      errors.longitude = "Missing longitude";
    }

    if (!values.latitude) {
      errors.latitude = "Missing latitude";
    }

    return errors;
  };

  return (
    <Box width={"100%"}>
      <Create>
        <SimpleForm validate={validateDeviceCreation}>
          <Box display="flex" flexDirection="column" width="100%">
            <Box
              flex={1}
              ml={{ xs: 0, sm: "0.5em" }}
              mr={{ xs: 0, sm: "0.5em" }}
            >
              <TextInput
                variant="outlined"
                label="Unique Device ID"
                source="device_id"
                isRequired
                fullWidth
                validate={required()}
              />
              <Box flex={1} display={"flex"} flexDirection="row">
                <Box mr="0.2em" flex={1}>
                  <TextInput
                    variant="outlined"
                    label="Address"
                    source="address"
                    isRequired
                    fullWidth
                    validate={required()}
                  />
                </Box>
              </Box>
              <Box flex={1} display={"flex"} flexDirection="row">
                <NumberInput
                  variant="outlined"
                  label="Latitude"
                  source="latitude"
                  isRequired
                  fullWidth
                  validate={required()}
                />
              </Box>
              <Box flex={1} display={"flex"} flexDirection="row">
                <NumberInput
                  variant="outlined"
                  label="Longitude"
                  source="longitude"
                  isRequired
                  fullWidth
                  validate={required()}
                />
              </Box>
            </Box>
          </Box>
        </SimpleForm>
      </Create>
    </Box>
  );
};

export default DeviceCreate;
