import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import JobDetail from './pages/JobDetail';
import HomeownerJobDetail from './pages/HomeownerJobDetail';
import NewJob from './pages/NewJob';
import AdminJobsDebug from './pages/AdminJobsDebug';
import Admin from './pages/Admin';
import Sales from './pages/Sales';
import Homeowner from './pages/Homeowner';
import SignIn from './pages/SignIn';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "Dashboard": Dashboard,
    "JobDetail": JobDetail,
    "HomeownerJobDetail": HomeownerJobDetail,
    "NewJob": NewJob,
    "AdminJobsDebug": AdminJobsDebug,
    "Admin": Admin,
    "Sales": Sales,
    "Homeowner": Homeowner,
    "SignIn": SignIn,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};