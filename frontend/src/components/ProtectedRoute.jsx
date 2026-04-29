import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Loader2 } from "lucide-react";

export default function ProtectedRoute({ children }) {
  const { user, checked } = useAuth();
  if (!checked) {
    return (
      <div className="min-h-screen grid place-items-center bg-[#F7F5F0]">
        <Loader2 className="w-6 h-6 animate-spin text-[#2C3D30]" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
