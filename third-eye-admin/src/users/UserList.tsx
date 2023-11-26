import {InfiniteList, TextField, Datagrid, SearchInput, Count, List} from 'react-admin';
import {Box} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import React from 'react';
import MaleIcon from '@mui/icons-material/Male';
import CorporateFareIcon from '@mui/icons-material/CorporateFare';
import {SavedQueriesList, FilterList, FilterListItem} from 'react-admin';
import {Card, CardContent} from '@mui/material';

// TODO: Add batch filtering 
export const UserFilterSideBar = () => (
    <Card sx={{order: -1, mr: 2, mt: 6, width: 240}}>
        <CardContent>
            <SavedQueriesList />
            <FilterList label="User Status" icon={<PersonIcon />}>
                <FilterListItem label="Admin" value={{userRole: 'ADMIN'}} />
                <FilterListItem label="Manager" value={{userRole: 'MANAGER'}} />
                <FilterListItem label="Verified User" value={{userRole: 'VERIFIEDUSER'}} />
                <FilterListItem label="Under Verification User" value={{userRole: 'UNDERVERIFICATIONUSER'}} />
                <FilterListItem label="Unverified User" value={{userRole: 'UNVERIFIEDUSER'}} />
            </FilterList>
            <FilterList label="Gender" icon={<MaleIcon />}>
                <FilterListItem label="Male" value={{gender: 'MALE'}} />
                <FilterListItem label="Female" value={{gender: 'FEMALE'}} />
                <FilterListItem label="Unspecified" value={{gender: 'UNSPECIFIED'}} />
            </FilterList>
            <FilterList label="Batch" icon={<CorporateFareIcon />}>
                <FilterListItem label="Computer Science" value={{faculty: 'COMPUTERSCIENCE'}} />
                <FilterListItem label="Computer Engineering" value={{faculty: 'COMPUTERENGINEERING'}} />
                <FilterListItem label="Artifical Intelligence" value={{faculty: 'ARTIFICIALINTELLIGENCE'}} />
            </FilterList>
        </CardContent>
    </Card>
);

const UserList = () => {
    return <Box width={"100%"}>
        <List aside={<UserFilterSideBar />}>
            <Datagrid rowClick="edit" optimized>
                <TextField source="fullName" />
                <TextField source="primaryEmail" />
            </Datagrid>
        </List>
    </Box>
}


export default UserList;

