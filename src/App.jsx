import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Home from './components/Home';
import Editor from './components/Editor';

const routerBasename = import.meta.env.BASE_URL.replace(/\/$/, '');

// Helper component to handle SPA redirects from 404.html
function RedirectHandler() {
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const redirectPath = searchParams.get('/');

    if (redirectPath) {
        return <Navigate to={redirectPath} replace />;
    }
    return null;
}

function App() {
    return (
        <Router basename={routerBasename || undefined}>
            <RedirectHandler />
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/note/:noteId" element={<Editor />} />
            </Routes>
        </Router>
    );
}

export default App;
