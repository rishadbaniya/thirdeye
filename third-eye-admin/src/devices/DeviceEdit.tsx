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
  TextField,
} from "react-admin";
import { SelectInput } from "react-admin";
import { Box } from "@mui/material";
import { ImageInput, ImageField } from "react-admin";
import React, { useEffect, useState } from "react";
import Button from "@mui/material/Button";
import useWebSocket, { ReadyState } from "react-use-websocket";
import axios from "axios";
import { format, differenceInSeconds } from "date-fns";

const DeviceEdit = (props) => {
  return (
    <Edit {...props}>
      <DeviceEditForm />
    </Edit>
  );
};

const API_URl = "http://20.228.82.13:8000/devices";
const DeviceEditForm = () => {
  const id = useRecordContext().id;
  const [compResource, updateCompResource] = useState({});

  useEffect(() => {
    // Function to fetch data using Axios
    const fetchData = async () => {
      axios
        .get(`${API_URl}/${id}`)
        .then((response) => {
          console.log(response.data);
          updateCompResource({ compResource, ...response.data });
        })
        .catch((error) => {
          // Handle errors
          console.error("Error fetching data:", error.message);
        });
    };

    const pollingInterval = 2000;
    const pollingId = setInterval(fetchData, pollingInterval);
    return () => clearInterval(pollingId);
  }, [id]);

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

          <Box flex={1} display={"flex"} flexDirection="row">
            {compResource.resource ? (
              <ResourceBox input={compResource} />
            ) : (
              <></>
            )}
          </Box>
        </Box>
      </SimpleForm>
    </Box>
  );
};

const ResourceBox = (props) => {
  let isActive = (epochTime: any) => {
    const date = new Date(epochTime * 1000);
    const formattedDate = format(date, "yyyy-MM-dd HH:mm:ss");

    const currentDateTime = new Date();
    const difference = differenceInSeconds(currentDateTime, date);

    return difference <= 30;
  };
  console.log(props);
  return (
    <>
      {props.input.resource[0] ? (
        <Box display="flex" flexDirection="column" width="100%">
          <Box flex={1} ml={{ xs: 0, sm: "0.5em" }} mr={{ xs: 0, sm: "0.5em" }}>
            <Box flex={1} display={"flex"} flexDirection="row">
              <p>
                Is Online :{" "}
                <b>{isActive(props.input.resource[0].time) ? "Yes" : "No"}</b>
              </p>
            </Box>
            <Box flex={1} display={"flex"} flexDirection="row">
              <p>CPU Cores : {props.input.resource[0].cpu_cores}</p>
            </Box>
            <Box flex={1} display={"flex"} flexDirection="row">
              <p>CPU Brand : {props.input.resource[0].cpu_brand}</p>
            </Box>
            <Box flex={1} display={"flex"} flexDirection="row">
              <p>CPU Frequency : {props.input.resource[0].cpu_frequency}</p>
            </Box>
            <Box flex={1} display={"flex"} flexDirection="row">
              <p>
                Memory Size :{" "}
                {props.input.resource[0].memory_size / 1024 / 1024} <b>Bytes</b>
              </p>
            </Box>
            <Box flex={1} display={"flex"} flexDirection="row">
              <p>
                Memory Size Available:{" "}
                {props.input.resource[0].memory_available} <b>Bytes</b>
              </p>
            </Box>
            <Box flex={1} display={"flex"} flexDirection="row">
              <p>
                Memory Size Used: {props.input.resource[0].memory_used}{" "}
                <b>Bytes</b>
              </p>
            </Box>
            <Box flex={1} display={"flex"} flexDirection="row">
              <p>Uptime: {props.input.resource[0].uptime} seconds</p>
            </Box>
          </Box>
        </Box>
      ) : (
        <></>
      )}
    </>
  );
};

export default DeviceEdit;
