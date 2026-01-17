import AssistantSettings from './pages/AssistantSettings';
import Dashboard from './pages/Dashboard';
import Drive from './pages/Drive';
import FileViewer from './pages/FileViewer';
import Profile from './pages/Profile';
import Trash from './pages/Trash';
import Wiki from './pages/Wiki';
import Terminal from './pages/Terminal';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AssistantSettings": AssistantSettings,
    "Dashboard": Dashboard,
    "Drive": Drive,
    "FileViewer": FileViewer,
    "Profile": Profile,
    "Trash": Trash,
    "Wiki": Wiki,
    "Terminal": Terminal,
}

export const pagesConfig = {
    mainPage: "Drive",
    Pages: PAGES,
    Layout: __Layout,
};