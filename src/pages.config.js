import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import JobDetail from './pages/JobDetail';
import HomeownerJobDetail from './pages/HomeownerJobDetail';
import NewJob from './pages/NewJob';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "Dashboard": Dashboard,
    "JobDetail": JobDetail,
    "HomeownerJobDetail": HomeownerJobDetail,
    "NewJob": NewJob,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};