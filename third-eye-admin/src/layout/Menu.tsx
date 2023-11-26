import * as React from 'react';
import {useState} from 'react';
import Box from '@mui/material/Box';
import EventIcon from '@mui/icons-material/Event';
import UsersIcon from '@mui/icons-material/Group';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

import {
    useTranslate,
    DashboardMenuItem,
    MenuItemLink,
    MenuProps,
    useSidebarState,
} from 'react-admin';
import SubMenu from './SubMenu';

type MenuName = 'menuCatalog' | 'menuSales' | 'menuCustomers';

const Menu = ({dense = false}: MenuProps) => {
    const [state, setState] = useState({
        menuCatalog: true,
        menuSales: true,
        menuCustomers: true,
    });
    const translate = useTranslate();
    const [open] = useSidebarState();

    const handleToggle = (menu: MenuName) => {
        setState(state => ({...state, [menu]: !state[menu]}));
    };

    return (
        <Box
            sx={{
                width: open ? 200 : 50,
                marginTop: 1,
                marginBottom: 1,
                transition: theme =>
                    theme.transitions.create('width', {
                        easing: theme.transitions.easing.sharp,
                        duration: theme.transitions.duration.leavingScreen,
                    }),
            }}
        >

            <DashboardMenuItem />
            <MenuItemLink
                to="/User"
                state={{_scrollToTop: true}}
                primaryText="Users"
                leftIcon={<UsersIcon />}
                dense={dense}
            />
            <MenuItemLink
                to="/Event"
                state={{_scrollToTop: true}}
                primaryText="Events"
                leftIcon={<EventIcon />}
                dense={dense}
            />
            <MenuItemLink
                to="/Routine"
                state={{_scrollToTop: true}}
                primaryText={"Routines"}
                leftIcon={<AccessTimeIcon />}
                dense={dense}
            />

        </Box>
    );
};


//<MenuItemLink
//    to="/Event"
//    state={{_scrollToTop: true}}
//    primaryText={translate(`Events`, {
//        smart_count: 2,
//    })}
//    leftIcon={<EventIcon />}
//    dense={dense}
///>
//<MenuItemLink
//    to="/Event"
//    state={{_scrollToTop: true}}
//    primaryText={translate(`Events`, {
//        smart_count: 2,
//    })}
//    leftIcon={<EventIcon />}
//    dense={dense}
///>

//<SubMenu
//    handleToggle={() => handleToggle('menuSales')}
//    isOpen={state.menuSales}
//    name="pos.menu.sales"
//    icon={<orders.icon />}
//    dense={dense}
//>
//    <MenuItemLink
//        to="/commands"
//        state={{_scrollToTop: true}}
//        primaryText={translate(`resources.commands.name`, {
//            smart_count: 2,
//        })} leftIcon={<orders.icon />}
//        dense={dense}
//    />
//    <MenuItemLink
//        to="/invoices"
//        state={{_scrollToTop: true}}
//        primaryText={translate(`resources.invoices.name`, {
//            smart_count: 2,
//        })}
//        leftIcon={<invoices.icon />}
//        dense={dense}
//    />
//</SubMenu>
//<SubMenu
//    handleToggle={() => handleToggle('menuCatalog')}
//    isOpen={state.menuCatalog}
//    name="pos.menu.catalog"
//    icon={<products.icon />}
//    dense={dense}
//>
//    <MenuItemLink
//        to="/products"
//        state={{_scrollToTop: true}}
//        primaryText={translate(`resources.products.name`, {
//            smart_count: 2,
//        })}
//        leftIcon={<products.icon />}
//        dense={dense}
//    />
//    <MenuItemLink
//        to="/categories"
//        state={{_scrollToTop: true}}
//        primaryText={translate(`resources.categories.name`, {
//            smart_count: 2,
//        })}
//        leftIcon={<categories.icon />}
//        dense={dense}
//    />
//</SubMenu>
//<SubMenu
//    handleToggle={() => handleToggle('menuCustomers')}
//    isOpen={state.menuCustomers}
//    name="pos.menu.customers"
//    icon={<visitors.icon />}
//    dense={dense}
//>
//    <MenuItemLink
//        to="/customers"
//        state={{_scrollToTop: true}}
//        primaryText={translate(`resources.customers.name`, {
//            smart_count: 2,
//        })}
//        leftIcon={<visitors.icon />}
//        dense={dense}
//    />

//</SubMenu>
export default Menu;
