import * as React from 'react';
import {Layout} from 'react-admin';
import CustomKUCCAppBar from './AppBar';
import Menu from './Menu';

const CustomKUCCLayout = (props) => {
    return <Layout {...props} appBar={CustomKUCCAppBar} menu={Menu} />
}

export default CustomKUCCLayout;
