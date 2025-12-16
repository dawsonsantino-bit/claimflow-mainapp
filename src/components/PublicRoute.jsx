import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/components/auth/AuthProvider";

const roleHome = (role) => {
  if (role === "Homeowner") return "/homeowner";
  if (role === "SalesRep") return "/sales";
  if (role === "CompanyAdmin" || role === "LocationAdmin") return "/admin";
  return "/dashboard";
};

export default function PublicRoute({ children }) {
  const { currentUser, loading } = useAuth?.() ?? { currentUser: null, loading: false };
  
  if (loading) return null;
  
  if (currentUser) {
    return <Navigate to={roleHome(currentUser.business_role)} replace />;
  }
  
  return children;
}