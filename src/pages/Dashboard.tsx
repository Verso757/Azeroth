import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Problem, Area, Priority, ProblemStatus } from '../types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  History as HistoryIcon
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn, formatDate } from '../lib/utils';

export default function Dashboard() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubAreas = onSnapshot(collection(db, 'areas'), (snap) => {
      setAreas(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Area)));
    });

    const qProblems = query(collection(db, 'problems'), orderBy('createdAt', 'desc'));
    const unsubProblems = onSnapshot(qProblems, (snap) => {
      setProblems(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Problem)));
      setLoading(false);
    });

    return () => {
      unsubAreas();
      unsubProblems();
    };
  }, []);

  // Stats
  const total = problems.length;
  const open = problems.filter(p => p.status === 'open').length;
  const inProgress = problems.filter(p => p.status === 'in_progress').length;
  const closed = problems.filter(p => p.status === 'closed').length;
  const highPriority = problems.filter(p => p.priority === 'high' && p.status !== 'closed').length;

  // Top Recurrent Problems
  const topRecurrent = [...problems]
    .filter(p => (p.recurrenceCount || 0) > 0)
    .sort((a, b) => (b.recurrenceCount || 0) - (a.recurrenceCount || 0))
    .slice(0, 5);

  // Chart Data: Problems by Area
  const areaData = areas.map(area => ({
    name: area.name,
    count: problems.filter(p => p.areaId === area.id).length
  })).sort((a, b) => b.count - a.count);

  // Status Distribution
  const statusData = [
    { name: 'Abierto', value: open, color: '#3b82f6' },
    { name: 'En Proceso', value: inProgress, color: '#f59e0b' },
    { name: 'Cerrado', value: closed, color: '#10b981' },
  ].filter(d => d.value > 0);

  // Recent Trend (last 7 days - simplified mock logic based on occurrenceDate)
  // In a real app we'd group by day
  const trendData = [
    { day: 'Lun', count: 4 },
    { day: 'Mar', count: 3 },
    { day: 'Mié', count: 6 },
    { day: 'Jue', count: 2 },
    { day: 'Vie', count: 5 },
    { day: 'Sáb', count: 1 },
    { day: 'Dom', count: 2 },
  ];

  if (loading) return (
    <div className="h-full flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  );

  return (
    <div className="space-y-8 pb-12">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Panel de Control</h1>
          <p className="text-slate-500 font-medium">Resumen general del estado de las operaciones</p>
        </div>
        <div className="hidden md:flex bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm items-center gap-2">
          <Clock className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-semibold text-slate-600">Última actualización: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Problemas" 
          value={total} 
          icon={AlertCircle} 
          color="blue"
          percentage="+12%"
          trend="up"
        />
        <StatCard 
          title="Abiertos/En Proceso" 
          value={open + inProgress} 
          icon={Clock} 
          color="amber" 
          percentage="-5%"
          trend="down"
        />
        <StatCard 
          title="Resueltos" 
          value={closed} 
          icon={CheckCircle2} 
          color="emerald" 
          percentage="+24%"
          trend="up"
        />
        <StatCard 
          title="Alta Prioridad" 
          value={highPriority} 
          icon={AlertTriangle} 
          color="red" 
          percentage="Crítico"
          trend="none"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart: Problems by Area */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-xl font-bold text-slate-800">Incidencias por Área</h3>
              <p className="text-sm text-slate-500">Distribución de reportes entre departamentos</p>
            </div>
            <TrendingUp className="text-primary w-6 h-6" />
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={areaData} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  tick={{ fill: '#64748b', fontSize: 13, fontWeight: 500 }} 
                  width={150}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar 
                  dataKey="count" 
                  fill="#3b82f6" 
                  radius={[0, 8, 8, 0]} 
                  barSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution Pie Chart */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-xl font-bold text-slate-800 mb-8">Estado Actual</h3>
          <div className="h-64 relative">
             <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-bold text-slate-800">{total}</span>
              <span className="text-xs text-slate-400 uppercase font-bold tracking-widest">Total</span>
            </div>
          </div>
          <div className="mt-8 space-y-3">
            {statusData.map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm font-medium text-slate-600">{item.name}</span>
                </div>
                <span className="text-sm font-bold text-slate-800">{Math.round((item.value / total) * 100)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Trend Chart */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-xl font-bold text-slate-800 mb-8">Tendencia Semanal</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 13 }}
                  dy={10}
                />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#3b82f6" 
                  strokeWidth={4} 
                  dot={{ fill: '#3b82f6', r: 6, strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recently Added List */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <HistoryIcon className="w-6 h-6 text-amber-500" />
            Mayores Recurrencias
          </h3>
          <div className="space-y-4 overflow-auto max-h-[300px]">
            {topRecurrent.length > 0 ? (
              topRecurrent.map((problem) => (
                <div key={problem.id} className="flex gap-4 items-start p-3 hover:bg-slate-50 transition-colors rounded-2xl group">
                  <div className="bg-amber-100 text-amber-700 w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0">
                    { (problem.recurrenceCount || 0) + 1 }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate group-hover:text-primary transition-colors">{problem.title}</p>
                    <p className="text-xs text-slate-500">{areas.find(a => a.id === problem.areaId)?.name}</p>
                  </div>
                  <div className="text-xs font-bold text-slate-400 shrink-0">
                    {formatDate(problem.createdAt)}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-400 italic">
                No hay recurrencias registradas aún.
              </div>
            )}
          </div>
          <button className="mt-8 text-sm font-bold text-primary hover:text-primary-dark transition-colors text-center w-full">
            Gestionar todos los problemas
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, percentage, trend }: any) {
  const colors: any = {
    blue: 'bg-blue-600 shadow-blue-500/20 text-white',
    amber: 'bg-amber-500 shadow-amber-500/20 text-white',
    emerald: 'bg-emerald-600 shadow-emerald-500/20 text-white',
    red: 'bg-red-500 shadow-red-500/20 text-white'
  };

  const bgColors: any = {
    blue: 'bg-blue-50',
    amber: 'bg-amber-50',
    emerald: 'bg-emerald-50',
    red: 'bg-red-50'
  };

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group"
    >
      <div className="flex justify-between items-start mb-4">
        <div className={cn("p-4 rounded-2xl", colors[color])}>
          <Icon className="w-6 h-6" />
        </div>
        <div className={cn(
          "flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold",
          trend === 'up' ? 'text-emerald-600 bg-emerald-50' : 
          trend === 'down' ? 'text-red-500 bg-red-50' : 
          'text-slate-500 bg-slate-50'
        )}>
          {trend === 'up' && <ArrowUpRight className="w-3 h-3" />}
          {trend === 'down' && <ArrowDownRight className="w-3 h-3" />}
          {percentage}
        </div>
      </div>
      <div>
        <h4 className="text-slate-500 font-bold text-xs uppercase tracking-widest mb-1">{title}</h4>
        <p className="text-3xl font-black text-slate-900 tracking-tight">{value}</p>
      </div>
      <div className={cn("absolute -right-4 -bottom-4 w-24 h-24 rounded-full transition-transform group-hover:scale-110", bgColors[color])} />
    </motion.div>
  );
}
