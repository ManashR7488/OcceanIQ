import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import Header from "../../components/Header/Header";

const Layout = () => {
  const location = useLocation();

  const isAuthRoute = location.pathname.includes("/auth/");
  if (isAuthRoute) {
    console.log("🔓 Rendering auth route without layout");
    return <Outlet />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="grid grid-cols-[auto_1fr] min-h-screen">
        <Navbar />
        <div className="flex flex-col h-screen overflow-y-scroll">
          <Header />
          <main className="flex-1 p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default Layout;
