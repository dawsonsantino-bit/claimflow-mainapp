/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import Admin from './pages/Admin';
import CompanySettings from './pages/CompanySettings';
import Dashboard from './pages/Dashboard';
import Fires from './pages/Fires';
import Help from './pages/Help';
import Home from './pages/Home';
import Homeowner from './pages/Homeowner';
import HomeownerJobDetail from './pages/HomeownerJobDetail';
import InviteAccept from './pages/InviteAccept';
import JobDetail from './pages/JobDetail';
import NewJob from './pages/NewJob';
import Owner from './pages/Owner';
import OwnerTest from './pages/OwnerTest';
import ResetPassword from './pages/ResetPassword';
import RoleRescue from './pages/RoleRescue';
import Sales from './pages/Sales';
import SignIn from './pages/SignIn';
import Users from './pages/Users';
import Demo from './pages/Demo';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Admin": Admin,
    "CompanySettings": CompanySettings,
    "Dashboard": Dashboard,
    "Fires": Fires,
    "Help": Help,
    "Home": Home,
    "Homeowner": Homeowner,
    "HomeownerJobDetail": HomeownerJobDetail,
    "InviteAccept": InviteAccept,
    "JobDetail": JobDetail,
    "NewJob": NewJob,
    "Owner": Owner,
    "OwnerTest": OwnerTest,
    "ResetPassword": ResetPassword,
    "RoleRescue": RoleRescue,
    "Sales": Sales,
    "SignIn": SignIn,
    "Users": Users,
    "Demo": Demo,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};