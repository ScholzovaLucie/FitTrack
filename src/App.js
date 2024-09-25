import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import { ThemeProvider, createTheme } from '@mui/material/styles';  // Importujeme ThemeProvider a createTheme
import { SpeedInsights } from "@vercel/speed-insights/react"
import Home from './components/Home';
import Login from './components/Login';
import Register from './components/Register';
import MainPage from './components/MainPage';
import Profile from './components/Profile';
import CreateEvent from './components/CreateEvent';
import ProtectedRoute from './components/ProtectedRoute';

const theme = createTheme();  // Vytvoření výchozího tématu

function App() {
  return (
    <AuthProvider>
      <ThemeProvider theme={theme}>  {/* Obalení aplikace do ThemeProvider */}
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Všechny chráněné stránky obalíme do ProtectedRoute */}
            <Route 
              path="/mainpage" 
              element={
                <ProtectedRoute>
                  <MainPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/create-event" 
              element={
                <ProtectedRoute>
                  <CreateEvent />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
