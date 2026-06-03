import { Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Navbar from "./Navbar";

export default function Layout() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#0f0f1a] text-gray-100">
      {user && <Navbar />}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <Outlet />
      </main>
      <footer className="border-t border-white/5 py-6 text-center text-xs text-gray-600">
        LY-OPS Hub · 内部工作台
      </footer>
    </div>
  );
}
