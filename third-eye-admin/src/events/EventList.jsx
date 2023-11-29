import React from 'react';
import {List, TextField, Datagrid, Layout, AppBar} from 'react-admin';
import {Box} from '@mui/material';

const EventList = () => {
    return <Box style={{display: 'flex', flex: 1, width: "100%"}}>
        <List style={{"width": "100%"}}>
            <Datagrid rowClick="edit">
                <TextField source="title" />
                <TextField source="date" /> <TextField source="noOfRegistrants" label="No Of Registrants" /> <TextField source="location" />
            </Datagrid>
        </List>
    </Box>
}

export default EventList;
