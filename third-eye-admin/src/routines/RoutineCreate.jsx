import {
    Create,
    SelectInput,
    NumberInput,
    SimpleForm,
    BooleanInput,
} from 'react-admin';
import {Box, Typography} from '@mui/material';
import Schedule from './Schedule';
import {format} from 'date-fns'

const RoutineCreate = () => {

    const validateRoutineCreation = (values) => {
        console.log(values);
        const errors = {};

        if (!values.faculty) {
            errors["faculty"] = "Missing faculty";
        }

        if (!values.batch) {
            errors["batch"] = "Missing batch";
        }

        if (!values.schedule) {
            errors["schedule"] = "Missing Schedule";
        }

        return errors;
    };
    return <Create>
        <SimpleForm validate={validateRoutineCreation}>
            <Box display="flex" alignItems={"center"} width="100%">
                <Box flex={1} ml={{xs: 0, sm: '0.5em'}} mr={{xs: 0, sm: '0.5em'}}>
                    <Box pr="0.2em" flex={1}>
                        <NumberInput
                            max={2024}
                            min={2019}
                            label="Batch"
                            source="batch"
                            fullWidth
                        />
                    </Box>
                </Box>
                <Box flex={1} ml={{xs: 0, sm: '0.5em'}} mr={{xs: 0, sm: '0.5em'}}>
                    <Box pl="0.2em" flex={1}>
                        <SelectInput source="faculty" label="Faculty" choices={[
                            {id: 'COMPUTERSCIENCE', name: 'Computer Science'},
                            {id: 'COMPUTERENGINEERING', name: 'Computer Engineering'},
                            {id: 'ARTIFICIALINTELLIGENCE', name: 'Artificial Intelligence'},
                        ]} fullWidth />
                    </Box>
                </Box>
            </Box>

            <Box flex={1} ml={{xs: 0, sm: '0.5em'}} mr={{xs: 0, sm: '0.5em'}}>
                <BooleanInput label="Is Draft?" source="isDraft" />
            </Box>
            <Typography variant="h6" gutterBottom align='left' ml="0.5em" mb={"-0.05em"} fontWeight={"bold"}>
                Schedule
            </Typography>
            <Schedule source={"schedule"}></Schedule>
        </SimpleForm>
    </Create>
}

export default RoutineCreate;

