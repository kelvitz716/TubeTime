import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Dashboard from './pages/Dashboard';
import VideoDetails from './pages/VideoDetails';
import Stats from './pages/Stats';
import Login from './pages/Login';

import ResourceTracker from './pages/ResourceTracker';

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return <div className="flex items-center justify-center h-screen bg-background text-text-primary">Loading...</div>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" />;
    }

    return children;
};

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route
                    path="/"
                    element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/video/:id"
                    element={
                        <ProtectedRoute>
                            <VideoDetails />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/stats"
                    element={
                        <ProtectedRoute>
                            <Stats />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/resources"
                    element={
                        <ProtectedRoute>
                            <ResourceTracker />
                        </ProtectedRoute>
                    }
                />
            </Routes>
        </Router>
    );
}

export default App;

