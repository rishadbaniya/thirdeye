import * as React from 'react';
import {
    BooleanInput,
    Edit,
    useInput,
    TabbedForm,
    TextInput,
    DateTimeInput,
    ArrayInput,
    SimpleFormIterator,
    RecordContext,
} from 'react-admin';
import {Box, Typography} from '@mui/material';
import MDEditor from '@uiw/react-md-editor';
import {parse} from 'date-fns'
import Chip from '@mui/material/Chip';
import {DATE_FORMAT, transformEventSubmissionData} from './EventCreate';

const EventEdit = () => {
    return <Edit transform={transformEventSubmissionData}>
        <EventEditForm />
    </Edit>
}

const EventEditForm = () => {
    const validateEventEdit = (values: any) => {
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

    const transformInputData = (input_data: any) => {
        let transformed_input_data = {...input_data};
        transformed_input_data.categories = transformed_input_data.categories.map((d: string) => {
            console.log(d);
            return {
                category: d
            };
        });

        transformed_input_data.date = new Date(transformed_input_data.date * 1000);
        return transformed_input_data;
    }

    return <Box pt={"1em"} pl={"0.4em"} display="flex" width={"100%"}>
        <RecordContext.Consumer>
            {value => {
                let transormed_input_data = transformInputData(value);
                let registrants = transormed_input_data.registrants ? transormed_input_data.registrants : [];
                return <TabbedForm warnWhenUnsavedChanges={true} style={{"width": "100%"}} validate={validateEventEdit} record={transormed_input_data}>
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
                    <TabbedForm.Tab label="Registrants">
                        {registrants.map((d: any, i: number) => {
                            return <Box p={"0.4em"}>
                                <Chip label={d} key={i} />
                            </Box>
                        })}
                        <Typography variant="h6" gutterBottom align='left' ml="0.4em" mt="0.4em" fontWeight={"bold"} textAlign={"center"}>
                            Total Registrants: {registrants.length}
                        </Typography>
                    </TabbedForm.Tab>
                </TabbedForm >
            }
            }
        </RecordContext.Consumer>
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


export default EventEdit;
