import React from "react";
import { Route, Routes } from "react-router-dom";
import Layout from "./pages/Layout/Layout";
import Dashboard from "./pages/Dashboard/Dashboard";
import AllFeatures from "./pages/AllFeatures/AllFeatures";

const App = () => {
  return (
    <div className="min-h-screen w-full relative">
      <Routes>
        <Route path="/" element={<div>Home</div>} />
        <Route path="/app" element={<Layout />}>
          <Route path="" element={<AllFeatures />} />
          <Route path="dashboard" element={<Dashboard />} />

          {/* Authentication Routes */}
          <Route path="auth/login" element={<div>Login</div>} />
          <Route path="auth/register" element={<div>Register</div>} />

          {/* User Routes */}
          <Route path="profile" element={<div>Profile</div>} />
          <Route path="settings" element={<div>Settings</div>} />
          <Route path="help" element={<div>Help</div>} />
          <Route path="*" element={<div>404 Not Found</div>} />
        </Route>
      </Routes>
    </div>
  );
};

export default App;
