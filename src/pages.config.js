import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import JobDetail from './pages/JobDetail';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "Dashboard": Dashboard,
    "JobDetail": JobDetail,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};