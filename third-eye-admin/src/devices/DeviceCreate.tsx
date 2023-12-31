import {
  List,
  TextInput,
  Datagrid,
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

const UserCreate = () => {
  const validateUserCreation = (values: UserCreateValues) => {
    const errors: UserCreateValues = {};
    if (!values.fullName) {
      errors.fullName = "Missing Full Name";
    }

    if (!values.email) {
      errors.email = "Missing Email!";
    }

    if (!values.password) {
      errors.password = "Missing Password!";
    }

    return errors;
  };

  return (
    <Box width={"100%"}>
      <Create>
        <SimpleForm validate={validateUserCreation}>
          <Box display="flex" flexDirection="column" width="100%">
            <Box
              flex={1}
              ml={{ xs: 0, sm: "0.5em" }}
              mr={{ xs: 0, sm: "0.5em" }}
            >
              <TextInput
                variant="outlined"
                label="Full Name"
                source="fullName"
                isRequired
                fullWidth
                validate={required()}
              />
              <Box flex={1} display={"flex"} flexDirection="row">
                <Box mr="0.2em" flex={1}>
                  <TextInput
                    variant="outlined"
                    label="Email"
                    source="email"
                    isRequired
                    fullWidth
                    validate={required()}
                  />
                </Box>
              </Box>
              <Box flex={1} display={"flex"} flexDirection="row">
                <TextInput
                  variant="outlined"
                  label="Password"
                  source="password"
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

export default UserCreate;
