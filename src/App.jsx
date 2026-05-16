import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import Editor from './components/Editor';

const routerBasename = import.meta.env.BASE_URL.replace(/\/$/, '');

function App() {
    return (
        <Router basename={routerBasename || undefined}>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/note/:noteId" element={<Editor />} />
            </Routes>
        </Router>
    );
}

export default App;
