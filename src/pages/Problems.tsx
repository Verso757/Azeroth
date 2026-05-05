import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp, where, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Problem, Area, Priority, ProblemStatus, OperationType } from '../types';
import { 
  Plus, 
  Search, 
  Filter, 
  Clock, 
  ChevronDown, 
  MoreVertical,
  CheckCircle2,
  AlertTriangle,
  History as HistoryIcon,
  Tag,
  Loader2,
  Calendar,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, formatDate } from '../lib/utils';

export default function Problems() {
  const { profile, isAdmin, user } = useAuth();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolutionText, setResolutionText] = useState('');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [areaFilter, setAreaFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    // Sync Areas
    const qAreas = query(collection(db, 'areas'), orderBy('name', 'asc'));
    const unsubAreas = onSnapshot(qAreas, (snap) => {
      setAreas(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Area)));
    });

    // Sync Problems
    let qProblems = query(collection(db, 'problems'), orderBy('createdAt', 'desc'));
    
    // If not admin, only show own problems
    if (!isAdmin && user) {
      qProblems = query(collection(db, 'problems'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
    }

    const unsubProblems = onSnapshot(qProblems, 
      (snap) => {
        setProblems(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Problem)));
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'problems');
      }
    );

    return () => {
      unsubAreas();
      unsubProblems();
    };
  }, [isAdmin, user]);

  const filteredProblems = problems.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         p.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesArea = areaFilter === 'all' || p.areaId === areaFilter;
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesArea && matchesStatus;
  });

  const handleStatusChangeClick = (id: string, newStatus: ProblemStatus) => {
    if (newStatus === 'closed') {
      setResolvingId(id);
      setResolutionText('');
    } else {
      updateStatus(id, newStatus);
    }
  };

  const confirmCloseProblem = async () => {
    if (!resolvingId || !resolutionText.trim()) return;
    try {
      await updateDoc(doc(db, 'problems', resolvingId), { 
        status: 'closed',
        resolutionText,
        resolvedBy: profile?.name || user?.email || 'Admin',
        resolvedAt: serverTimestamp()
      });
      setResolvingId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `problems/${resolvingId}`);
    }
  };

  const updateStatus = async (id: string, newStatus: ProblemStatus) => {
    try {
      await updateDoc(doc(db, 'problems', id), { status: newStatus });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `problems/${id}`);
    }
  };

  const deleteProblem = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta incidencia?')) return;
    try {
      await deleteDoc(doc(db, 'problems', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `problems/${id}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Incidencias y Problemas</h1>
          <p className="text-slate-500">
            {isAdmin ? 'Gestiona todos los problemas reportados' : 'Registra y sigue tus reportes'}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-primary hover:bg-primary-dark text-white font-semibold flex items-center gap-2 px-6 py-3 rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Nuevo Reporte
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por título o descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
        
        <div className="flex gap-2 shrink-0">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={areaFilter}
              onChange={(e) => setAreaFilter(e.target.value)}
              className="pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer text-sm font-medium"
            >
              <option value="all">Todas las Áreas</option>
              {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-4 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer text-sm font-medium"
            >
              <option value="all">Todos los Estados</option>
              <option value="open">Abiertos</option>
              <option value="in_progress">En Proceso</option>
              <option value="closed">Cerrados</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-slate-500 font-medium">Cargando incidencias...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredProblems.length > 0 ? (
              filteredProblems.map((problem) => (
                <ProblemCard 
                  key={problem.id} 
                  problem={problem} 
                  areaName={areas.find(a => a.id === problem.areaId)?.name || 'Área desconocida'}
                  isAdmin={isAdmin}
                  onStatusChange={handleStatusChangeClick}
                  onDelete={deleteProblem}
                />
              ))
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-slate-100/50 border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center"
              >
                <AlertTriangle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-700">No se encontraron resultados</h3>
                <p className="text-slate-500">Intenta cambiar los filtros o busca algo diferente.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {resolvingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden p-6"
          >
            <h3 className="text-xl font-bold text-slate-800 mb-2">Cerrar Incidencia</h3>
            <p className="text-slate-500 mb-4 text-sm">Describe brevemente cómo se solucionó este problema.</p>
            <textarea
              autoFocus
              rows={4}
              value={resolutionText}
              onChange={(e) => setResolutionText(e.target.value)}
              placeholder="Ej. Se reemplazó el disco duro del servidor principal..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 outline-none resize-none mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setResolvingId(null)}
                className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={confirmCloseProblem}
                disabled={!resolutionText.trim()}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 rounded-xl shadow-lg transition-all disabled:opacity-50"
              >
                Cerrar Incidencia
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* New Problem Modal */}
      <AnimatePresence>
        {showModal && (
          <ProblemModal 
            onClose={() => setShowModal(false)} 
            areas={areas} 
            existingProblems={problems.filter(p => p.status !== 'closed')}
            userId={user?.uid || ''}
            reporterName={profile?.name || user?.email || 'Usuario'}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ProblemCard({ problem, areaName, isAdmin, onStatusChange, onDelete }: any) {
  const priorityColors = {
    high: 'text-red-600 bg-red-50 border-red-100',
    medium: 'text-orange-600 bg-orange-50 border-orange-100',
    low: 'text-green-600 bg-green-50 border-green-100'
  };

  const statusInfo: Record<ProblemStatus, { label: string, color: string, icon: any }> = {
    open: { label: 'Abierto', color: 'text-blue-600 bg-blue-50 border-blue-100', icon: Clock },
    in_progress: { label: 'En Proceso', color: 'text-amber-600 bg-amber-50 border-amber-100', icon: HistoryIcon },
    closed: { label: 'Cerrado', color: 'text-emerald-600 bg-emerald-50 border-emerald-100', icon: CheckCircle2 }
  };

  const StatusIcon = statusInfo[problem.status as ProblemStatus].icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group"
    >
      <div className="flex justify-between gap-4">
        <div className="flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border", priorityColors[problem.priority as Priority])}>
              {problem.priority}
            </span>
            <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border flex items-center gap-1", statusInfo[problem.status as ProblemStatus].color)}>
              <StatusIcon size={10} />
              {statusInfo[problem.status as ProblemStatus].label}
            </span>
            <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500 border border-slate-200 px-2 py-0.5 rounded-full">
              <Tag size={10} />
              {areaName}
            </span>
            {problem.recurrenceCount > 0 && (
              <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
                <HistoryIcon size={10} />
                {problem.recurrenceCount + 1} Ocurrencias
              </span>
            )}
          </div>

          <div>
            <h3 className="font-bold text-slate-900 text-lg group-hover:text-primary transition-colors">{problem.title}</h3>
            <p className="text-slate-600 text-sm line-clamp-2 mt-1">{problem.description}</p>
            
            {problem.status === 'closed' && problem.resolutionText && (
              <div className="mt-3 p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block mb-1">
                  Solución por {problem.resolvedBy}:
                </span>
                <p className="text-sm text-emerald-700">{problem.resolutionText}</p>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
            {problem.reporterName && (
              <div className="flex items-center gap-1.5">
                <span className="w-5 h-5 bg-slate-200 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-500">
                  {problem.reporterName.charAt(0).toUpperCase()}
                </span>
                <span>{problem.reporterName}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Calendar size={14} />
              <span>Incidente: {problem.occurrenceDate}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock size={14} />
              <span>Reportado: {formatDate(problem.createdAt)}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          {isAdmin && (
            <div className="flex gap-1">
              {['open', 'in_progress', 'closed'].map((s) => (
                <button
                  key={s}
                  onClick={() => onStatusChange(problem.id, s as ProblemStatus)}
                  className={cn(
                    "text-[10px] font-bold uppercase tracking-tighter px-2 py-1 rounded-md border transition-all",
                    problem.status === s 
                      ? statusInfo[s as ProblemStatus].color
                      : "bg-white text-slate-400 border-slate-100 hover:border-slate-200"
                  )}
                >
                  {statusInfo[s as ProblemStatus].label}
                </button>
              ))}
            </div>
          )}
          
          <button 
            onClick={() => onDelete(problem.id)}
            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function ProblemModal({ onClose, areas, existingProblems, userId, reporterName }: any) {
  const [isRecurrence, setIsRecurrence] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    areaId: '',
    priority: 'medium' as Priority,
    occurrenceDate: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isRecurrence && selectedParentId) {
        // Update existing problem
        const parentRef = doc(db, 'problems', selectedParentId);
        const parent = existingProblems.find((p: any) => p.id === selectedParentId);
        
        // Add occurrence to subcollection
        await addDoc(collection(db, 'problems', selectedParentId, 'occurrences'), {
          userId,
          date: formData.occurrenceDate,
          note: formData.description,
          createdAt: serverTimestamp()
        });

        // Increment recurrence count
        await updateDoc(parentRef, {
          recurrenceCount: (parent?.recurrenceCount || 0) + 1
        });
      } else {
        // Create new problem
        await addDoc(collection(db, 'problems'), {
          ...formData,
          userId,
          reporterName,
          status: 'open',
          recurrenceCount: 0,
          createdAt: serverTimestamp()
        });
      }
      onClose();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'problems');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden"
      >
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-xl font-bold text-slate-800">
            {isRecurrence ? 'Reportar Recurrencia' : 'Nuevo Reporte de Incidencia'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        <div className="p-8 pb-0">
          <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
            <button
              onClick={() => setIsRecurrence(false)}
              className={cn(
                "flex-1 py-2 text-sm font-bold rounded-lg transition-all",
                !isRecurrence ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              Nuevo Problema
            </button>
            <button
              onClick={() => setIsRecurrence(true)}
              className={cn(
                "flex-1 py-2 text-sm font-bold rounded-lg transition-all",
                isRecurrence ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              Recurrencia (Ya reportado)
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 pt-0 space-y-5">
          {isRecurrence ? (
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Seleccionar Problema Abierto</label>
              <select
                required
                value={selectedParentId}
                onChange={(e) => setSelectedParentId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              >
                <option value="">Buscar incidente...</option>
                {existingProblems.map((p: Problem) => (
                  <option key={p.id} value={p.id}>{p.title} ({areas.find((a: any) => a.id === p.areaId)?.name})</option>
                ))}
              </select>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Título del Problema</label>
              <input
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Resume el problema en pocas palabras"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              />
            </div>
          )}

          {!isRecurrence && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Área Responsable</label>
                <select
                  required
                  value={formData.areaId}
                  onChange={(e) => setFormData({ ...formData, areaId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                >
                  <option value="">Selecciona área...</option>
                  {areas.map((a: Area) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Prioridad</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as Priority })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                >
                  <option value="low">Baja</option>
                  <option value="medium">Media</option>
                  <option value="high">Alta</option>
                </select>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Fecha de esta Ocurrencia</label>
            <input
              type="date"
              required
              value={formData.occurrenceDate}
              onChange={(e) => setFormData({ ...formData, occurrenceDate: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">
              {isRecurrence ? 'Nota Adicional (Opcional)' : 'Descripción Detallada'}
            </label>
            <textarea
              rows={isRecurrence ? 2 : 4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={isRecurrence ? "Agrega algún detalle de esta nueva vez..." : "¿Qué sucedió? ¿Cuáles son los impactos?"}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || (isRecurrence && !selectedParentId)}
              className="flex-1 bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-xl shadow-lg shadow-primary/20 transition-all disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {loading && <Loader2 className="w-5 h-5 animate-spin" />}
              {isRecurrence ? 'Reportar Recurrencia' : 'Guardar Reporte'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
