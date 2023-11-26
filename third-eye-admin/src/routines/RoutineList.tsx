import {List, TextField, Datagrid} from 'react-admin';
import {Box} from '@mui/material';
import React from 'react';

const RoutineList = () => {
    return <Box width={"100%"}>
        <List>
            <Datagrid rowClick="edit" >
                <TextField source="batch" />
                <TextField source="faculty" />
                <TextField source="isDraft" label={"Is Draft?"} />
            </Datagrid>
        </List>
    </Box>
}

export default RoutineList;

