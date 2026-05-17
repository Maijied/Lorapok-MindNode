import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Home from './components/Home';
import Editor from './components/Editor';

const routerBasename = import.meta.env.BASE_URL.replace(/\/$/, '');

function RedirectHandler() {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const redirectPath = params.get('p');
        if (redirectPath) {
            navigate(redirectPath, { replace: true });
        }
    }, [location, navigate]);

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
