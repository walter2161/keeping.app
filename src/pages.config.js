import Drive from './pages/Drive';
import FileViewer from './pages/FileViewer';
import Trash from './pages/Trash';
import Dashboard from './pages/Dashboard';
import Wiki from './pages/Wiki';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Drive": Drive,
    "FileViewer": FileViewer,
    "Trash": Trash,
    "Dashboard": Dashboard,
    "Wiki": Wiki,
}

export const pagesConfig = {
    mainPage: "Drive",
    Pages: PAGES,
    Layout: __Layout,
};