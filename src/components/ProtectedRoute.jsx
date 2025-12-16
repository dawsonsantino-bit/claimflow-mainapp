import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/components/auth/AuthProvider";
import { Loader2 } from "lucide-react";

export default function ProtectedRoute({ children }) {
  const { currentUser, loading } = useAuth?.() ?? { currentUser: null, loading: false };
  
  if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      );
  }
  
  if (!currentUser) return <Navigate to="/SignIn" replace />;
  
  return children;
}