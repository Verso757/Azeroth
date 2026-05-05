import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Problem, Area } from '../types';
import { 
  FileSpreadsheet, 
  Download, 
  Calendar, 
  Filter, 
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileText,
  History as HistoryIcon
} from 'lucide-react';
import { motion } from 'motion/react';
import * as XLSX from 'xlsx';
import { formatDate, cn } from '../lib/utils';

import { useAuth } from '../contexts/AuthContext';

export default function Reports() {
  const { profile, isAdmin, user } = useAuth();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [areaFilter, setAreaFilter] = useState('all');

  useEffect(() => {
    const unsubAreas = onSnapshot(collection(db, 'areas'), (snap) => {
      setAreas(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Area)));
    });

    const qProblems = query(collection(db, 'problems'), orderBy('createdAt', 'desc'));
    const unsubProblems = onSnapshot(qProblems, (snap) => {
      let docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Problem));
      if (!isAdmin && user && profile) {
        const assignedAreas = profile.areaIds || [];
        docs = docs.filter(p => p.userId === user.uid || assignedAreas.includes(p.areaId));
      }
      setProblems(docs);
      setLoading(false);
    });

    return () => {
      unsubAreas();
      unsubProblems();
    };
  }, []);

  const filteredProblems = problems.filter(p => {
    const matchesArea = areaFilter === 'all' || p.areaId === areaFilter;
    const itemDate = new Date(p.occurrenceDate);
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    
    const matchesDate = (!start || itemDate >= start) && (!end || itemDate <= end);
    return matchesArea && matchesDate;
  });

  const exportToExcel = () => {
    setExporting(true);
    try {
      const dataToExport = filteredProblems.map(p => ({
        'Título': p.title,
        'Descripción': p.description,
        'Área': areas.find(a => a.id === p.areaId)?.name || 'Desconocida',
        'Prioridad': p.priority.toUpperCase(),
        'Estado': p.status.toUpperCase(),
        'Recurrencias': (p.recurrenceCount || 0) + 1,
        'Reportado Por': p.reporterName || 'N/A',
        'Solución': p.resolutionText || 'N/A',
        'Solucionado Por': p.resolvedBy || 'N/A',
        'Fecha Último Incidente': p.occurrenceDate,
        'Fecha Registro': formatDate(p.createdAt)
      }));

      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Incidencias');
      
      const fileName = `Reporte_Incidencias_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Generador de Reportes</h1>
        <p className="text-slate-500">Exporta datos detallados para análisis externo</p>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-600 flex items-center gap-2">
              <Calendar size={16} className="text-primary" />
              Fecha Inicial
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-slate-700"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-600 flex items-center gap-2">
              <Calendar size={16} className="text-primary" />
              Fecha Final
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-slate-700"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-600 flex items-center gap-2">
              <Filter size={16} className="text-primary" />
              Área
            </label>
            <select
              value={areaFilter}
              onChange={(e) => setAreaFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-slate-700"
            >
              <option value="all">Todas las Áreas</option>
              {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 bg-slate-50 rounded-2xl border border-slate-100">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-4 rounded-xl">
              <FileText className="w-8 h-8 text-primary" />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-800">Resumen de Exportación</p>
              <p className="text-sm text-slate-500">Se exportarán <span className="font-bold text-primary">{filteredProblems.length}</span> registros encontrados.</p>
            </div>
          </div>
          
          <button
            onClick={exportToExcel}
            disabled={exporting || filteredProblems.length === 0}
            className="flex items-center gap-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 px-8 rounded-2xl shadow-lg shadow-emerald-600/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {exporting ? <Loader2 className="w-6 h-6 animate-spin" /> : <FileSpreadsheet className="w-6 h-6 group-hover:scale-110 transition-transform" />}
            Descargar Reporte Excel
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-slate-800">Vista Previa de Datos</h3>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Mostrando registros filtrados</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Título</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Área</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Prioridad</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Rec.</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProblems.length > 0 ? (
                filteredProblems.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-500 font-medium whitespace-nowrap">{p.occurrenceDate}</td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-800">{p.title}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-medium">{areas.find(a => a.id === p.areaId)?.name}</td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border",
                        p.priority === 'high' ? 'text-red-600 border-red-100 bg-red-50' : 
                        p.priority === 'medium' ? 'text-orange-600 border-orange-100 bg-orange-50' : 
                        'text-green-600 border-green-100 bg-green-50'
                      )}>
                        {p.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-600">
                      {(p.recurrenceCount || 0) + 1}
                    </td>
                    <td className="px-6 py-4 text-right">
                       <span className={cn(
                        "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border",
                        p.status === 'open' ? 'text-blue-600 border-blue-100 bg-blue-50' : 
                        p.status === 'in_progress' ? 'text-amber-600 border-amber-100 bg-amber-50' : 
                        'text-emerald-600 border-emerald-100 bg-emerald-50'
                      )}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium italic">
                    {loading ? 'Cargando datos...' : 'No se encontraron registros para los filtros seleccionados.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
