import Drive from './pages/Drive';
import FileViewer from './pages/FileViewer';
import Trash from './pages/Trash';
import Dashboard from './pages/Dashboard';
import Wiki from './pages/Wiki';
import WikiDev from './pages/WikiDev';
import Settings from './pages/Settings';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Drive": Drive,
    "FileViewer": FileViewer,
    "Trash": Trash,
    "Dashboard": Dashboard,
    "Wiki": Wiki,
    "WikiDev": WikiDev,
    "Settings": Settings,
}

export const pagesConfig = {
    mainPage: "Drive",
    Pages: PAGES,
    Layout: __Layout,
};