import React, { useEffect } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import Layout from "./pages/Layout/Layout";
import Dashboard from "./pages/Dashboard/Dashboard";
import AllFeatures from "./pages/AllFeatures/AllFeatures";
import SignUp from "./pages/Auth/SignUp";
import Login from "./pages/Auth/Login";
import Profile from "./pages/Profile/Profile";
import Home from "./pages/Home/Home";
import useAuthStore from "./store/useAuthStore";
import Help from "./pages/Help/Help";
import NotFound from "./pages/Notfound/NotFound";
import Map from "./pages/Map/Map";
import Section1 from "./pages/Map/Section1";
import Section2 from "./pages/Map/Section2";
import Section3 from "./pages/Map/Section3";

const App = () => {
  const { user, checkAuth } = useAuthStore();

  useEffect(() => {
    // Check authentication only once when the app loads
    checkAuth();
  }, []); // Empty dependency array - runs only once on mount

  return (
    <div className="min-h-screen w-full relative">
      <ToastContainer limit={3} pauseOnFocusLoss={false} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/app" element={<Layout />}>
          <Route
            path=""
            element={user ? <AllFeatures /> : <Navigate to="/app/auth/login" />}
          />
          <Route
            path="dashboard"
            element={user ? <Dashboard /> : <Navigate to="/app/auth/login" />}
          />

          {/* features pages */}

          <Route
            path="map"
            element={user ? <Map /> : <Navigate to="/app/auth/login" />}
          >
            <Route index element={<Navigate to="section1" replace />} />
            <Route path="section1" element={<Section1 />} />
            <Route path="section2" element={<Section2 />} />
            <Route path="section3" element={<Section3 />} />
          </Route>

          {/* Authentication Routes */}
          <Route
            path="auth/login"
            element={user ? <Navigate to="/app" /> : <Login />}
          />
          <Route
            path="auth/register"
            element={user ? <Navigate to="/app" /> : <SignUp />}
          />

          {/* User Routes */}
          <Route
            path="profile"
            element={user ? <Profile /> : <Navigate to="/app/auth/login" />}
          />
          <Route
            path="settings"
            element={
              user ? <div>Settings</div> : <Navigate to="/app/auth/login" />
            }
          />
          <Route
            path="help"
            element={user ? <Help /> : <Navigate to="/app/auth/login" />}
          />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </div>
  );
};

export default App;
