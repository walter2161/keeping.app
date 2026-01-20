import AssistantSettings from './pages/AssistantSettings';
import Dashboard from './pages/Dashboard';
import Drive from './pages/Drive';
import FileViewer from './pages/FileViewer';
import Profile from './pages/Profile';
import Terminal from './pages/Terminal';
import Trash from './pages/Trash';
import Wiki from './pages/Wiki';
import FluxEditor from './pages/FluxEditor';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AssistantSettings": AssistantSettings,
    "Dashboard": Dashboard,
    "Drive": Drive,
    "FileViewer": FileViewer,
    "Profile": Profile,
    "Terminal": Terminal,
    "Trash": Trash,
    "Wiki": Wiki,
    "FluxEditor": FluxEditor,
}

export const pagesConfig = {
    mainPage: "Drive",
    Pages: PAGES,
    Layout: __Layout,
};