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

const UserEdit = (props) => {
  return (
    <Edit {...props}>
      <UserEditForm />
    </Edit>
  );
};
const UserEditForm = () => {
  const validateUserEdit = (values: UserCreateValues) => {
    const errors: UserCreateValues = {};
    if (!values.fullName) {
      errors.fullName = "Missing Full Name";
    }

    if (!values.email) {
      errors.email = "Missing Email!";
    }

    return errors;
  };

  return (
    <Box width={"100%"}>
      <SimpleForm validate={validateUserEdit}>
        <Box display="flex" flexDirection="column" width="100%">
          <Box flex={1} ml={{ xs: 0, sm: "0.5em" }} mr={{ xs: 0, sm: "0.5em" }}>
            <TextInput
              variant="outlined"
              label="Full Name"
              source="fullName"
              isRequired
              fullWidth
            />
            <Box flex={1} display={"flex"} flexDirection="row">
              <Box mr="0.2em" flex={1}>
                <TextInput
                  variant="outlined"
                  label="Primary Email"
                  source="email"
                  isRequired
                  fullWidth
                />
              </Box>
            </Box>
            <Box flex={1} display={"flex"} flexDirection="row">
              <TextInput
                variant="outlined"
                label="New Password"
                source="password"
                fullWidth
              />
            </Box>
          </Box>
        </Box>
      </SimpleForm>
    </Box>
  );
};

export default UserEdit;
