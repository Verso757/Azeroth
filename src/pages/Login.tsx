import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { loginWithGoogle } from '../lib/firebase';
import { AlertCircle, LogIn } from 'lucide-react';
import { motion } from 'motion/react';

export default function Login() {
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-8 text-center"
      >
        <div className="bg-primary/10 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-10 h-10 text-primary" />
        </div>
        
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Azeroth</h1>
        <p className="text-slate-500 mb-8">
          Sistema profesional de gestión de incidencias. Inicia sesión para continuar.
        </p>

        <button
          onClick={() => loginWithGoogle()}
          className="flex items-center justify-center gap-3 w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 group"
        >
          <LogIn className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          Continuar con Google
        </button>
        
        <p className="mt-8 text-xs text-slate-400">
          Al iniciar sesión, aceptas nuestra política de seguridad y términos de uso.
        </p>
      </motion.div>
    </div>
  );
}
