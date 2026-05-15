import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import Editor from './components/Editor';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/note/:noteId" element={<Editor />} />
            </Routes>
        </Router>
    );
}

export default App;
