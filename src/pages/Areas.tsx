import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, serverTimestamp, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db, handleFirestoreError } from '../lib/firebase';
import { Area, OperationType } from '../types';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Areas() {
  const [areas, setAreas] = useState<Area[]>([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'areas'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        setAreas(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Area)));
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'areas');
        setLoading(false);
      }
    );
    return unsubscribe;
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'areas'), {
        name: name.trim(),
        createdAt: serverTimestamp()
      });
      setName('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'areas');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta área?')) return;
    try {
      await deleteDoc(doc(db, 'areas', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `areas/${id}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-800 mb-8">Gestión de Áreas</h1>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-8">
        <h2 className="text-lg font-semibold mb-4">Nueva Área</h2>
        <form onSubmit={handleSubmit} className="flex gap-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Producción, Logística, Logística..."
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-800"
            disabled={submitting}
          />
          <button
            type="submit"
            disabled={submitting || !name.trim()}
            className="bg-primary hover:bg-primary-dark text-white font-semibold flex items-center gap-2 px-6 py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
            Agregar
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-slate-800">Listado de Áreas</h2>
          <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
            {areas.length} Registradas
          </span>
        </div>
        
        {loading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            <AnimatePresence initial={false}>
              {areas.length > 0 ? (
                areas.map((area) => (
                  <motion.li
                    key={area.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="p-4 hover:bg-slate-50 transition-colors flex justify-between items-center group"
                  >
                    <span className="font-medium text-slate-700">{area.name}</span>
                    <button
                      onClick={() => handleDelete(area.id)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </motion.li>
                ))
              ) : (
                <li className="p-12 text-center text-slate-500">
                  No hay áreas registradas todavía.
                </li>
              )}
            </AnimatePresence>
          </ul>
        )}
      </div>
    </div>
  );
}
