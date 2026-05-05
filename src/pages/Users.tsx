import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { collection, query, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Shield, ShieldAlert, User, ShieldCheck, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { Area, UserProfile, UserRole, OperationType } from '../types';

export default function Users() {
  const { isAdmin: isSuperAdmin } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isSuperAdmin) {
      fetchData();
    }
  }, [isSuperAdmin]);

  const fetchData = async () => {
    try {
      const [usersSnap, areasSnap] = await Promise.all([
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'areas'))
      ]);
      setUsers(usersSnap.docs.map(d => ({ id: d.id, ...d.data() } as UserProfile)));
      setAreas(areasSnap.docs.map(d => ({ id: d.id, ...d.data() } as Area)));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'users');
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (userId: string, data: Partial<UserProfile>) => {
    try {
      await updateDoc(doc(db, 'users', userId), data);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...data } : u));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    }
  };

  const toggleArea = async (user: UserProfile, areaId: string) => {
    const currentAreas = user.areaIds || [];
    const newAreas = currentAreas.includes(areaId)
      ? currentAreas.filter(id => id !== areaId)
      : [...currentAreas, areaId];
    
    await updateUser(user.id, { areaIds: newAreas });
  };

  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-slate-500">
          <ShieldAlert className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <h2 className="text-xl font-bold text-slate-800">Acceso Restringido</h2>
          <p>Solo los administradores pueden gestionar usuarios.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Gestión de Usuarios</h1>
        <p className="text-slate-500 mt-2">Administra roles y permisos por área de cada usuario.</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Usuario</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Rol Global</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-1/2">Áreas Asignadas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold shrink-0">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{user.name}</p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={user.role}
                      onChange={(e) => updateUser(user.id, { role: e.target.value as UserRole })}
                      className={cn(
                        "text-sm font-bold rounded-lg px-3 py-1.5 border outline-none",
                        user.role === 'admin' ? "bg-purple-50 text-purple-700 border-purple-200" :
                        user.role === 'manager' ? "bg-blue-50 text-blue-700 border-blue-200" :
                        "bg-slate-100 text-slate-700 border-slate-200"
                      )}
                    >
                      <option value="admin">Super Admin</option>
                      <option value="manager">Jefe de Área (Manager)</option>
                      <option value="operator">Operador / Usuario</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    {user.role === 'admin' ? (
                      <span className="text-xs text-slate-500 italic bg-slate-100 px-3 py-1 rounded-full">
                        Acceso total a todas las áreas
                      </span>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {areas.map(area => {
                          const isAssigned = user.areaIds?.includes(area.id);
                          return (
                            <button
                              key={area.id}
                              onClick={() => toggleArea(user, area.id)}
                              className={cn(
                                "text-xs font-semibold px-3 py-1 rounded-full border transition-all",
                                isAssigned 
                                  ? "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20" 
                                  : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                              )}
                            >
                              {area.name}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
