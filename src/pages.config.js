import Drive from './pages/Drive';
import FileViewer from './pages/FileViewer';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Drive": Drive,
    "FileViewer": FileViewer,
}

export const pagesConfig = {
    mainPage: "Drive",
    Pages: PAGES,
    Layout: __Layout,
};