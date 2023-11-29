import * as React from 'react';

import {
    TabbedForm,
    TextInput,
    DateTimeInput,
    ArrayInput,
    SimpleFormIterator,
    BooleanInput,
    Create,
    useInput
} from 'react-admin';
import {Box, Typography} from '@mui/material';
import MDEditor from '@uiw/react-md-editor';
import {format} from 'date-fns'

const DATE_FORMAT = "yyyy:MM:dd'T'HH:mm:ss"

const transformEventSubmissionData = (data: any) => {
    data.categories = data.categories.map((d: any) => d.category);
    data.date = data.date.getTime() / 1000;
    return data;
}
const EventCreate = () => {

    return <Create transform={transformEventSubmissionData}>
        <EventCreateForm />
    </Create>
}

const EventCreateForm = () => {
    const validateEventCreation = (values: any) => {
        console.log(values);
        const errors = {};

        if (!values.title) {
            errors["title"] = "Missing title";
        }

        if (!values.location) {
            errors["location"] = "Missing location";
        }

        if (!values.categories || Object.entries(values.categories).length === 0) {
            errors["categories"] = "Missing categories";
        }

        if (!values.description || values.length === 0) {
            errors["description"] = "Missing description";
        }

        if (!values.date) {
            errors["date"] = "Missing Date and Time";
        }

        return errors;
    };

    return <Box pt={"1em"} pl={"0.4em"} display="flex" width={"100%"}>
        <TabbedForm warnWhenUnsavedChanges={true} style={{"width": "100%"}} validate={validateEventCreation}>
            <TabbedForm.Tab label="summary">
                <Box flex={1} width="100%">
                    <TextInput
                        variant='outlined'
                        label="Title"
                        source="title"
                        isRequired
                        fullWidth
                    />
                </Box>
                <Box flex={1} width="100%">
                    <TextInput
                        variant='outlined'
                        label="Location"
                        source="location"
                        isRequired
                        fullWidth
                    />
                </Box>
                <Box flex={1}>
                    <BooleanInput label="Is Draft?" source="isDraft" />
                </Box>
                <Box display={{xs: 'block', sm: 'flex'}}>
                    <Box flex={1} >
                        <Typography variant="h6" gutterBottom align='left' ml="0.2em" mb={"-0.3em"} fontWeight={"bold"}>
                            Date and Time
                        </Typography>
                        <DateTimeInput source='date' fullWidth isRequired label="" />
                    </Box>
                </Box>

                <Box display={{xs: 'block', sm: 'flex'}}>
                    <Box flex={5}>
                        <Typography variant="h6" gutterBottom align='left' ml="0.2em" mb={"-0.3em"} fontWeight={"bold"}>
                            Categories
                        </Typography>
                        <ArrayInput source='categories' label="">
                            <SimpleFormIterator>
                                <TextInput variant='outlined' source="category" />
                            </SimpleFormIterator>
                        </ArrayInput>
                    </Box>
                </Box>
                <Box></Box>
            </TabbedForm.Tab >
            <TabbedForm.Tab label="description">
                <MarkdownDescription source="description" />
            </TabbedForm.Tab>
        </TabbedForm >
    </Box>
}

const MarkdownDescription = ({source}) => {
    const {field} = useInput({source});

    const editorStyle = {
        width: "100%",
        height: "700px",
    };
    const onValueChange = (e: any) => {
        field.onChange(e)
    }

    return (<div className="container" style={editorStyle} data-color-mode="dark">
        <MDEditor value={field.value} onChange={onValueChange} height="100%" hideToolbar={true} />
    </div>)
}

export {DATE_FORMAT, transformEventSubmissionData}
export default EventCreate;

