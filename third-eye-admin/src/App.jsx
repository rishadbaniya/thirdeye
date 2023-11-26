import {useEffect, useId, useState} from 'react'
import './App.css'
import {Admin, Edit, Resource, useCreate, useInput, useStore} from 'react-admin'
import {List, TextField, Datagrid, Layout, AppBar} from 'react-admin';
import EventEdit from './events/EventEdit';


import CustomKUCCLayout from './layout/Layout';
import themes from './themes/themes';
import {Box} from '@mui/material';

import graphqlProvider from './dataProvider';

import RoutineEdit from './routines/RoutineEdit';
import RoutineCreate from './routines/RoutineCreate';
import RoutineList from './routines/RoutineList';
import UserList from './users/UserList';
import UserCreat from './users/UserCreate';
import UserCreate from './users/UserCreate';
import authProvider from './authProvider';
import LogIn from './LogIn';
import UserEdit from './users/UsersEdit';
import EventCreate from './events/EventCreate';
import EventList from './events/EventList';



const App = () => {
    let [dataProvider, udpateDataProvider] = useState(null);
    const [themeName] = useStore('themeName', 'default');

    const lightTheme = themes.find(theme => theme.name === themeName)?.light;
    const darkTheme = themes.find(theme => theme.name === themeName)?.dark;
    const [accessToken, setAccessToken] = useState(localStorage.getItem("access_token"));

    const onLogin = () => {
        setAccessToken(localStorage.getItem("access_token"));
    };

    useEffect(() => {
        graphqlProvider(accessToken).then((d) => {
            udpateDataProvider(d);
        });
    }, [accessToken]);
    return (
        <>
            {dataProvider != null ?
                <Admin
                    name="rishadbaniya"
                    loginPage={() => LogIn(onLogin)}
                    dataProvider={dataProvider}
                    authProvider={authProvider}
                    layout={CustomKUCCLayout}
                    lightTheme={lightTheme}
                    darkTheme={darkTheme}
                >
                    <Resource name="User" list={UserList} create={UserCreate} edit={UserEdit}></Resource>
                    <Resource name="Event" list={EventList} create={EventCreate} edit={EventEdit}></Resource>
                    <Resource name="Routine" list={RoutineList} edit={RoutineEdit} create={RoutineCreate}></Resource>
                </Admin> : <></>
            }
        </>
    )

}


const Dashboard = (props) => {
    console.log("THE DATA IS ");
    console.log(props);
    return <div> alsfjaslfjaslfjdsalfjj</div>
}

export default App
