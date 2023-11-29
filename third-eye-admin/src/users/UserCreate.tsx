import {List, TextInput, Datagrid, Create, SimpleForm, required, RadioButtonGroupInput, useNotify, NumberInput} from 'react-admin';
import {SelectInput} from 'react-admin';
import {Box} from '@mui/material';
import {ImageInput, ImageField} from 'react-admin';
import React, {useEffect, useState} from 'react';
import {uploadImage} from '../utils';

const UserCreate = () => {
    const validateUserCreation = (values: any) => {
        const errors = {};
        if (!values.fullName) {
            errors["fullName"] = "Missing Full Name";
        }

        if (!values.primaryEmail) {
            errors["primaryEmail"] = "Missing Primary Email!";
        }

        if (!values.password) {
            errors["password"] = "Missing Password!";
        }

        if (!values.phoneNumber) {
            errors["phoneNumber"] = "Missing Phone Number!";
        }

        if (!values.gender) {
            errors["gender"] = "Missing Gender!";
        }


        if (!values.userType) {
            errors["userType"] = "Missing User Role!";
        }

        if (!values.userRole) {
            errors["userRole"] = "Missing User Role!";
        } else if (values.userRole === "VERIFIEDUSER" || values.userRole === "MANAGER" || values.userRole === "ADMIN") {
            if (!values.batch) {
                errors["batch"] = "Missing Batch";
            }

            if (!values.faculty) {
                errors["faculty"] = "Missing faculty!";
            }

            if (!values.secondaryEmail) {
                errors["secondaryEmail"] = "Missing Secondary Email!";
            }

            if (!values.imageUrl) {
                errors["imageUrl"] = "Missing Profile Picture";
            }
        }
        return errors
    };

    const transformData = async (data: any) => {
        if (data.imageUrl) {
            data.imageUrl = await uploadImage(data.imageUrl.rawFile);
        }
        return data;
    }
    return <Box width={"100%"}>
        <Create transform={transformData}>
            <SimpleForm validate={validateUserCreation}>
                <Box display="flex" flexDirection="column" width="100%">
                    <Box flex={1} ml={{xs: 0, sm: '0.5em'}} mr={{xs: 0, sm: '0.5em'}}>
                        <TextInput
                            variant='outlined'
                            label="Full Name"
                            source="fullName"
                            isRequired
                            fullWidth
                            validate={required()}
                        />
                        <TextInput
                            variant='outlined'
                            label="Phone Number"
                            source="phoneNumber"
                            fullWidth
                        />
                        <Box flex={1} display={"flex"} flexDirection="row">
                            <Box mr="0.2em" flex={1}>
                                <TextInput
                                    variant='outlined'
                                    label="Primary Email"
                                    source="primaryEmail"
                                    isRequired
                                    fullWidth
                                    validate={required()}
                                />
                            </Box>
                            <Box ml="0.2em" flex={1}>
                                <TextInput
                                    variant='outlined'
                                    label="Secondary Email"
                                    source="secondaryEmail"
                                    fullWidth
                                />
                            </Box>
                        </Box>
                        <Box flex={1} display={"flex"} flexDirection="row">
                            <TextInput
                                variant='outlined'
                                label="Password"
                                source="password"
                                isRequired
                                fullWidth
                                validate={required()}
                            />
                        </Box>
                    </Box>
                    <Box flex={1} display={"flex"} flexDirection="row">
                        <Box pr="0.2em" flex={1}>
                            <NumberInput
                                max={2024}
                                min={2019}
                                label="Batch"
                                source="batch"
                                fullWidth
                            />
                        </Box>
                        <Box pl="0.2em" flex={1}>
                            <SelectInput source="faculty" label="Faculty" choices={[
                                {id: 'COMPUTERSCIENCE', name: 'Computer Science'},
                                {id: 'COMPUTERENGINEERING', name: 'Computer Engineering'},
                                {id: 'ARTIFICIALINTELLIGENCE', name: 'Artificial Intelligence'},
                            ]} fullWidth />
                        </Box>
                        <Box pl="0.2em" flex={1}>
                            <SelectInput source="userType" label="User Type" choices={[
                                {id: 'KUSTUDENT', name: 'KU Student'},
                                {id: 'DOCSEALUMNI', name: 'DOCSE Alumni'},
                                {id: 'DOCSESTUDENT', name: 'DOCSE Student'},
                                {id: 'KUCCGENERALMEMBER', name: 'KUCC General Member'},
                                {id: 'KUCCPRESIDENT', name: 'KUCC President'},
                                {id: 'KUCCTREASURER', name: 'KUCC Treasurer'},
                                {id: 'KUCCMEMBER', name: 'KUCC General Secretary'},
                                {id: 'KUCCVICEPRESIDENT', name: 'KUCC Vice President'},
                                {id: 'KUCCGENERALSECRETARY', name: 'KUCC General Secretary'},
                                {id: 'KUCCCLUBSECRETARY', name: 'KUCC Club Secretary'},
                                {id: 'KUCCEXECUTIVEMEMBER', name: 'KUCC Executive Member'},
                            ]} fullWidth />
                        </Box>
                    </Box>
                    <Box display={"flex"} flexDirection="column" alignSelf={"start"} flex={1}>
                        <Box flex={1}>
                            <RadioButtonGroupInput source="gender" choices={[
                                {id: 'MALE', name: 'Male'},
                                {id: 'FEMALE', name: 'Female'},
                                {id: 'UNSPECIFIED', name: 'Unspecified'},
                            ]} validate={required()} fullWidth />
                        </Box>
                        <Box flex={1}>
                            <RadioButtonGroupInput source="userRole" label="User Role" choices={[
                                {id: 'ADMIN', name: 'Admin'},// If Admin clicks on this then he would need a secondary email too
                                {id: 'MANAGER', name: 'Manager'},// If Admin clicks on this then he would need a secondary email too
                                {id: 'VERIFIEDUSER', name: 'Verified User'}, // If Admin clicks on this then he would need a secondary email too
                                {id: 'UNDERVERIFICATIONUSER', name: 'Under Verification User'}, // User that has the secondaryEmail verified and has submitted for verification
                                {id: 'UNVERIFIEDUSER', name: 'Unverified User'},

                            ]} validate={required()} fullWidth />
                        </Box>
                    </Box>

                    <ImageInput source="imageUrl" label="Profile Picture">
                        <ImageField source="src" title="title" />
                    </ImageInput>
                </Box>
            </SimpleForm>
        </Create>
    </Box >
}


export default UserCreate;

