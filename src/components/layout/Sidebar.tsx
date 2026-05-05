import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  AlertCircle, 
  BarChart3, 
  Settings, 
  LogOut,
  ChevronRight,
  ShieldCheck,
  X
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { logout } from '../../lib/firebase';
import { cn } from '../../lib/utils';
import { motion } from 'motion/react';

export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const { profile, isAdmin } = useAuth();

  const links = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/problems', icon: AlertCircle, label: 'Problemas' },
    { to: '/reports', icon: BarChart3, label: 'Reportes' },
  ];

  if (isAdmin) {
    links.push({ to: '/areas', icon: Settings, label: 'Áreas' });
  }

  return (
    <aside className="w-64 bg-sidebar border-r border-slate-200 h-screen flex flex-col sticky top-0">
      <div className="p-6">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-2">
            <div className="bg-primary p-2 rounded-lg">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-800">Azeroth</span>
          </div>
          {onClose && (
            <button onClick={onClose} className="md:hidden p-2 text-slate-400 hover:text-slate-600 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <nav className="space-y-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={onClose}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group",
                isActive 
                  ? "bg-primary text-white shadow-md shadow-primary/20" 
                  : "text-slate-600 hover:bg-slate-100"
              )}
            >
              {({ isActive }) => (
                <>
                  <link.icon className="w-5 h-5 flex-shrink-0" />
                  <span className="font-medium underline-offset-4 group-hover:underline decoration-white/30">{link.label}</span>
                  {isActive && (
                    <motion.div 
                      layoutId="active-indicator"
                      className="ml-auto"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </motion.div>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="mt-auto p-6 border-t border-slate-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden">
            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.email}`} alt="Avatar" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800 truncate">{profile?.name}</p>
            <div className="flex items-center gap-1">
              {isAdmin && <ShieldCheck className="w-3 h-3 text-primary" />}
              <p className="text-xs text-slate-500 uppercase tracking-wider">{profile?.role}</p>
            </div>
          </div>
        </div>
        
        <button
          onClick={() => logout()}
          className="flex items-center gap-3 w-full px-4 py-3 text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors group"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
}
