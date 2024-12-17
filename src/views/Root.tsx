import React, { FC } from "react";
import { Route } from "react-router";
import { HashRouter, Navigate, Routes } from "react-router-dom";

import GraphView from "./GraphView";
import HomeView from "./HomeView";
import Notifications from "./Notifications";
import Login from "./Login"

import { ProtectedRoute } from "../components/ProtectedRoute";
import { AuthProvider } from "../hooks/useAuth";

// import graph from "./graph.graphml"

const Root: FC = () => {
  
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<HomeView />} />
        {/* <Route path="/login" element={<Login />} /> */}
        <Route path="/graph" element={
            // <ProtectedRoute>
              <GraphView />
            // </ProtectedRoute>
          } 
          />
      </Routes>
    </AuthProvider>        
  );
};

export default Root;
