
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  ChevronDown,
  Plus,
  X,
  MessageSquare,
  ShoppingBag,
  Target,
  Wallet,
  Users,
  Sparkles,
  Layers,
  BrainCircuit,
  BarChart3,
  TrendingUp,
  ExternalLink,
  AlertCircle,
  Settings,
  CreditCard,
  Briefcase,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  FileText,
  LayoutDashboard,
  Beaker,
  Zap,
  DollarSign
} from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";

// --- TYPES (Consolidados para evitar errores de importación en Vercel) ---
export type SelectionMode = 'dia' | 'semana' | 'quincena' | 'mes' | 'rango';
export interface ClientDetail {
  id: string;
  name: string;
  amount: number;
  status: 'activo' | 'entregado';
  link: string;
  dateKey: string;
}
export interface DailyData {
  messages: number;
  sales: number;
  adSpend: number;
  clientsClosed: number;
}
export interface BusinessState {
  currentTab: 'dashboard' | 'clients' | 'ads' | 'lab';
  activeRange: {
    start: Date;
    end: Date;
    label: string;
    mode: SelectionMode;
  };
  viewingMonth: number;
  dataStore: Record<string, DailyData>;
  clients: ClientDetail[];
  settings: { avgTicketValue: number; marginPercentage: number; };
}
export interface Diagnosis {
  diagnosis: string; risks: string; strengths: string; actions: string[]; status: "Saludable" | "En Observación" | "Crítico";
}
export interface CalendarDay {
  date: Date; dayNumber: number; dayName: string; weekNumber: number; fortnight: 1 | 2; isToday: boolean; isSelected: boolean;
}

// --- CONSTANTS ---
const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const WEEK_DAYS_SHORT = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const YEAR_ACTIVE = 2026;
const NAVIGATION_TABS = [
  { id: 'dashboard', icon: <LayoutDashboard size={20} />, label: 'Resumen' },
  { id: 'clients', icon: <CreditCard size={20} />, label: 'Finanzas' },
  { id: 'ads', icon: <Target size={20} />, label: 'Marketing' },
  { id: 'lab', icon: <Beaker size={20} />, label: 'Auditoría' },
] as const;

// --- GEMINI SERVICE ---
// Fix: Use named parameter for apiKey as per guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const getBusinessDiagnosis = async (kpis: any, clients: ClientDetail[]): Promise<Diagnosis> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analiza financieramente Webworks CORP:
        Rev: ${kpis.revenue} CRC, Profit: ${kpis.profit} CRC, CPA: ${kpis.cpa} CRC, ROI: ${kpis.roi}x, Ticket: ${kpis.averageTicket} CRC, Cierres: ${clients.length}.
        Genera un diagnóstico COO senior, directo, en español y profesional.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            diagnosis: { type: Type.STRING },
            risks: { type: Type.STRING },
            strengths: { type: Type.STRING },
            actions: { type: Type.ARRAY, items: { type: Type.STRING } },
            status: { type: Type.STRING, enum: ["Saludable", "En Observación", "Crítico"] }
          },
          required: ["diagnosis", "risks", "strengths", "actions", "status"]
        }
      }
    });
    // Fix: Access .text property directly (do not call as a function)
    return JSON.parse(response.text || "{}") as Diagnosis;
  } catch (e) {
    return { diagnosis: "Error al procesar diagnóstico.", risks: "N/A", strengths: "N/A", actions: [], status: "En Observación" };
  }
};

// --- HELPERS ---
const getDateKey = (date: Date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'CRC', minimumFractionDigits: 0 }).format(val).replace('CRC', '₡');
};
const parseFormattedNumber = (val: string): number => parseFloat(val.replace(/[^\d]/g, '')) || 0;
const getDaysInMonth = (month: number, year: number): CalendarDay[] => {
  const date = new Date(year, month, 1);
  const days: CalendarDay[] = [];
  while (date.getMonth() === month) {
    days.push({
      date: new Date(date),
      dayNumber: date.getDate(),
      dayName: ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'][date.getDay()],
      weekNumber: 1, fortnight: date.getDate() <= 15 ? 1 : 2, isToday: false, isSelected: false
    });
    date.setDate(date.getDate() + 1);
  }
  return days;
};

// --- COMPONENTES ---
// Fix: Added missing EmptyState component
const EmptyState = ({ title, description }: { title: string; description: string }) => (
  <div className="flex flex-col items-center justify-center py-12 px-6 text-center bg-white border border-dashed border-slate-200 rounded-[2rem] space-y-3">
    <div className="p-4 bg-slate-50 rounded-2xl text-slate-300">
      <Zap size={24} />
    </div>
    <div className="space-y-1">
      <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight">{title}</h3>
      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{description}</p>
    </div>
  </div>
);

const MetricCard = React.memo(({ label, value, isCurrency = false, suffix = "", status = 'neutral', icon: Icon }: any) => {
  const statusColors = { green: "text-emerald-600 bg-emerald-50", red: "text-rose-600 bg-rose-50", neutral: "text-slate-400 bg-slate-50" };
  const displayValue = isCurrency ? formatCurrency(value) : value.toLocaleString();
  return (
    <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm premium-entrance transition-transform duration-200 hover:scale-[1.01]">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
          <div className="flex items-center space-x-2">
            <span className="text-xl font-extrabold tracking-tight text-slate-900">{displayValue}{suffix}</span>
            {status !== 'neutral' && <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${status === 'green' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>{status === 'green' ? '↑' : '↓'}</span>}
          </div>
        </div>
        {Icon && <div className={`p-2 rounded-xl ${statusColors[status]}`}><Icon size={16} /></div>}
      </div>
    </div>
  );
});

const DataEntryPanel = ({ isOpen, onClose, dateLabel, currentData, currentClients, onSave }: any) => {
  const [inputs, setInputs] = useState({ messages: '', sales: '', adSpend: '', clientsClosed: '' });
  const [clientDetails, setClientDetails] = useState<Partial<ClientDetail>[]>([]);
  useEffect(() => {
    if (isOpen) {
      setInputs({ messages: currentData?.messages.toString() || '', sales: currentData?.sales.toString() || '', adSpend: currentData?.adSpend.toString() || '', clientsClosed: currentData?.clientsClosed.toString() || '0' });
      setClientDetails(currentClients || []);
    }
  }, [currentData, currentClients, isOpen]);
  useEffect(() => {
    const closedCount = parseInt(inputs.clientsClosed) || 0;
    if (closedCount > clientDetails.length) {
      setClientDetails([...clientDetails, ...Array.from({ length: closedCount - clientDetails.length }).map(() => ({ name: '', amount: 0, status: 'entregado' as const, link: '' }))]);
    } else if (closedCount < clientDetails.length) {
      setClientDetails(clientDetails.slice(0, closedCount));
    }
  }, [inputs.clientsClosed]);
  const isFormIncomplete = !inputs.messages || !inputs.sales || !inputs.adSpend || clientDetails.some(c => !c.name || c.name.trim() === '');
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center px-4 pb-8 sm:p-4 fade-in-fast">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] premium-entrance">
        <div className="px-6 pt-8 pb-4 flex justify-between items-center border-b border-slate-50">
          <div><h3 className="text-lg font-bold text-slate-900 uppercase">Registro</h3><p className="text-[9px] font-bold text-sky-500 uppercase mt-1">{dateLabel}</p></div>
          <button onClick={onClose} className="p-2.5 bg-slate-50 rounded-xl text-slate-400"><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
          {[
            { label: 'Mensajes', field: 'messages', icon: <MessageSquare size={14} /> },
            { label: 'Ventas', field: 'sales', icon: <ShoppingBag size={14} /> },
            { label: 'Gasto Ads', field: 'adSpend', icon: <Target size={14} />, isCurrency: true },
            { label: 'Cierres', field: 'clientsClosed', icon: <Users size={14} /> }
          ].map(item => (
            <div key={item.field} className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">{item.label}*</label>
              <div className="flex items-center space-x-3">
                <span className="text-slate-300">{item.icon}</span>
                <input type="text" inputMode="numeric" value={item.isCurrency ? formatCurrency(parseInt(inputs[item.field as keyof typeof inputs]) || 0) : inputs[item.field as keyof typeof inputs]} onChange={e => {
                  const val = e.target.value;
                  const numeric = item.isCurrency ? parseFormattedNumber(val) : val.replace(/[^\d]/g, '');
                  setInputs(p => ({ ...p, [item.field]: numeric.toString() }));
                }} className="w-full bg-transparent text-lg font-extrabold text-slate-900 focus:outline-none" />
              </div>
            </div>
          ))}
          {clientDetails.map((client, idx) => (
            <div key={idx} className="p-4 rounded-2xl border border-slate-100 bg-white space-y-3">
              <input type="text" placeholder="Nombre y Proyecto*" value={client.name} onChange={e => { const n = [...clientDetails]; n[idx].name = e.target.value; setClientDetails(n); }} className="w-full text-base font-bold text-slate-900 border-b border-slate-50 focus:outline-none focus:border-sky-500 pb-1" />
              <input type="text" placeholder="Link (opcional)" value={client.link} onChange={e => { const n = [...clientDetails]; n[idx].link = e.target.value; setClientDetails(n); }} className="w-full text-[10px] font-bold text-sky-500 bg-slate-50 rounded-lg p-2 focus:outline-none" />
              <input type="text" inputMode="numeric" value={formatCurrency(client.amount || 0)} onChange={e => { const n = [...clientDetails]; n[idx].amount = parseFormattedNumber(e.target.value); setClientDetails(n); }} className="w-full text-sm font-bold text-slate-900 focus:outline-none" />
            </div>
          ))}
        </div>
        <div className="p-6 bg-white border-t border-slate-50"><button onClick={() => onSave(inputs, clientDetails)} disabled={isFormIncomplete} className={`w-full py-4 rounded-2xl text-[10px] font-bold uppercase transition-all shadow-md ${isFormIncomplete ? 'bg-slate-100 text-slate-400' : 'bg-slate-900 text-white'}`}>Guardar en Cloud</button></div>
      </div>
    </div>
  );
};

// --- APP PRINCIPAL ---
export default function App() {
  const [state, setState] = useState<BusinessState>(() => {
    const saved = localStorage.getItem('bl_v12_data');
    if (saved) {
      try {
        const p = JSON.parse(saved);
        return { ...p, activeRange: { ...p.activeRange, start: new Date(p.activeRange.start), end: new Date(p.activeRange.end) } };
      } catch (e) { console.error(e); }
    }
    const today = new Date();
    return {
      currentTab: 'dashboard', viewingMonth: today.getMonth(), activeRange: { start: today, end: today, label: `${today.getDate()} ${MONTH_NAMES[today.getMonth()]}`, mode: 'dia' }, dataStore: {}, clients: [], settings: { avgTicketValue: 45000, marginPercentage: 0.65 }
    };
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isEntryOpen, setIsEntryOpen] = useState(false);
  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null);
  const [isLoadingDiagnosis, setIsLoadingDiagnosis] = useState(false);

  useEffect(() => { localStorage.setItem('bl_v12_data', JSON.stringify(state)); }, [state]);

  const metrics = useMemo(() => {
    const start = state.activeRange.start; const end = state.activeRange.end;
    let totals = { messages: 0, sales: 0, adSpend: 0, daysWithData: 0 };
    const iter = new Date(start);
    while (iter <= end) {
      const data = state.dataStore[getDateKey(iter)];
      if (data) { totals.messages += data.messages; totals.sales += data.sales; totals.adSpend += data.adSpend; totals.daysWithData++; }
      iter.setDate(iter.getDate() + 1);
    }
    const filteredClients = state.clients.filter(c => { const d = new Date(c.dateKey + 'T00:00:00'); return d >= start && d <= end; });
    const revenue = filteredClients.reduce((acc, c) => acc + c.amount, 0);
    const profit = revenue - totals.adSpend;
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
    const adEfficiency = revenue > 0 ? (totals.adSpend / revenue) * 100 : 0;
    const roas = totals.adSpend > 0 ? (revenue / totals.adSpend) : 0;
    // Fix: Added missing convRate calculation
    const convRate = totals.messages > 0 ? (totals.sales / totals.messages) * 100 : 0;
    return { ...totals, revenue, profit, margin, adEfficiency, roas, convRate, filteredClients, cpa: totals.sales > 0 ? totals.adSpend / totals.sales : 0, avgTicket: filteredClients.length > 0 ? revenue / filteredClients.length : 0 };
  }, [state.activeRange, state.dataStore, state.clients]);

  const selectDay = (day: CalendarDay) => {
    setState(p => ({ ...p, activeRange: { start: day.date, end: day.date, label: `${day.dayNumber} ${MONTH_NAMES[day.date.getMonth()]}`, mode: 'dia' } }));
    setIsFilterOpen(false);
  };

  const handleSave = (inputs: any, clients: any) => {
    const key = getDateKey(state.activeRange.start);
    const daily: DailyData = { messages: parseInt(inputs.messages), sales: parseInt(inputs.sales), adSpend: parseInt(inputs.adSpend), clientsClosed: parseInt(inputs.clientsClosed) };
    const newClients = clients.map((c: any) => ({ ...c, id: Math.random().toString(36).substr(2, 9), dateKey: key }));
    setState(p => ({ ...p, dataStore: { ...p.dataStore, [key]: daily }, clients: [...p.clients.filter(c => c.dateKey !== key), ...newClients] }));
    setIsEntryOpen(false);
  };

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-[#FBFBFD] text-slate-900 overflow-hidden relative shadow-2xl">
      <header className="glass border-b border-slate-100 px-6 pt-10 pb-6 sticky top-0 z-[100]">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden"><img src="https://i.imgur.com/HrmZvvG.png" className="w-full h-full object-cover" /></div>
            <div><h1 className="text-sm font-black uppercase text-slate-800">Webworks CORP</h1><p className="text-[8px] font-bold text-sky-500 uppercase">V12 Operational AI</p></div>
          </div>
          <button onClick={() => setIsEntryOpen(true)} className="p-3.5 bg-sky-600 text-white rounded-xl shadow-lg active:scale-95 transition-all"><Plus size={18} strokeWidth={3} /></button>
        </div>
        <button onClick={() => setIsFilterOpen(true)} className="w-full flex items-center justify-between bg-white border border-slate-100 rounded-xl px-4 py-3 shadow-sm">
          <div className="flex items-center space-x-3 text-slate-700"><CalendarIcon size={14} className="text-sky-600" /><span className="text-xs font-bold">{state.activeRange.label}</span></div>
          <ChevronDown size={12} className="text-slate-300" />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto px-6 pt-6 pb-32 space-y-8 no-scrollbar scroll-smooth">
        {state.currentTab === 'dashboard' && (
          <div className="space-y-6 fade-in-fast">
            <h2 className="text-xs font-black text-slate-400 uppercase px-1">Resumen General</h2>
            {metrics.daysWithData === 0 && metrics.filteredClients.length === 0 ? <EmptyState title="Sin Datos" description="Pulsa (+) para añadir info." /> : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <MetricCard label="Mensajes" value={metrics.messages} icon={MessageSquare} />
                  <MetricCard label="Ventas" value={metrics.sales} icon={ShoppingBag} />
                </div>
                <MetricCard label="Ganancia Neta" value={metrics.profit} isCurrency status={metrics.profit >= 0 ? 'green' : 'red'} icon={Wallet} />
                <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm space-y-4">
                  <div className="flex justify-between items-center"><p className="text-[10px] font-black text-slate-400 uppercase">Embudo</p><div className="bg-sky-600 text-white text-[10px] font-black px-2 py-1 rounded-lg">{metrics.convRate.toFixed(1)}%</div></div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-sky-500" style={{ width: `${Math.min(metrics.convRate * 5, 100)}%` }} /></div>
                </div>
              </div>
            )}
          </div>
        )}

        {state.currentTab === 'clients' && (
          <div className="space-y-6 fade-in-fast">
            <div className="flex justify-between items-center px-1"><h2 className="text-xs font-black text-slate-400 uppercase">Estado Financiero</h2><div className="px-2 py-1 bg-sky-50 rounded-lg flex items-center space-x-1"><Activity size={10} className="text-sky-600" /><span className="text-[8px] font-black text-sky-600 uppercase">Auditado</span></div></div>
            
            <div className="bg-slate-900 rounded-[2rem] p-6 text-white shadow-xl space-y-6 premium-entrance relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-5"><TrendingUp size={120} /></div>
               <div><p className="text-[9px] font-black text-sky-400 uppercase tracking-widest">Utilidad del Periodo</p><h3 className="text-4xl font-black tracking-tighter">{formatCurrency(metrics.profit)}</h3></div>
               <div className="grid grid-cols-2 gap-4 border-t border-slate-800 pt-6">
                 <div><p className="text-[8px] font-bold text-slate-400 uppercase">Margen Operativo</p><p className="text-lg font-black text-sky-400">{metrics.margin.toFixed(1)}%</p></div>
                 <div><p className="text-[8px] font-bold text-slate-400 uppercase">ROAS</p><p className="text-lg font-black text-emerald-400">{metrics.roas.toFixed(2)}x</p></div>
               </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-3xl p-6 space-y-6 shadow-sm">
               <div className="flex items-center space-x-2 border-b border-slate-50 pb-4"><FileText size={16} className="text-sky-600" /><h4 className="text-xs font-black uppercase">P&L (Estado de Resultados)</h4></div>
               <div className="space-y-4">
                 <div className="flex justify-between items-center"><span className="text-[10px] font-bold text-slate-400 uppercase">Ingresos Brutos</span><span className="text-sm font-black">{formatCurrency(metrics.revenue)}</span></div>
                 <div className="flex justify-between items-center"><span className="text-[10px] font-bold text-slate-400 uppercase">Costos Publicitarios</span><span className="text-sm font-bold text-rose-500">({formatCurrency(metrics.adSpend)})</span></div>
                 <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl"><span className="text-[10px] font-black uppercase text-slate-900">Resultado Neto</span><span className={`text-base font-black ${metrics.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{formatCurrency(metrics.profit)}</span></div>
               </div>
               <div className="space-y-3 pt-2">
                 <div className="flex justify-between text-[8px] font-black uppercase"><span className="text-slate-400">Eficiencia Ads (ACOS)</span><span className="text-sky-600">{metrics.adEfficiency.toFixed(1)}%</span></div>
                 <div className="w-full h-1.5 bg-slate-50 rounded-full overflow-hidden"><div className="h-full bg-sky-400" style={{ width: `${Math.min(metrics.adEfficiency, 100)}%` }} /></div>
               </div>
            </div>

            <div className="space-y-3">
              <p className="text-[9px] font-black text-slate-300 uppercase px-1">Desglose de Operaciones</p>
              {metrics.filteredClients.length === 0 ? <EmptyState title="Vacio" description="No hay cierres." /> : metrics.filteredClients.map(c => (
                <div key={c.id} className="bg-white border border-slate-100 p-4 rounded-2xl flex justify-between items-center shadow-sm hover:border-sky-200 transition-all">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-xs font-black text-slate-400 border border-slate-100">{c.name.charAt(0)}</div>
                    <div><h4 className="text-xs font-bold text-slate-800">{c.name}</h4><p className="text-[10px] font-bold text-slate-400">{formatCurrency(c.amount)}</p></div>
                  </div>
                  <div className="text-right"><span className="text-[7px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded uppercase font-black">Cobrado</span></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {state.currentTab === 'ads' && (
          <div className="space-y-6 fade-in-fast">
             <h2 className="text-xs font-black text-slate-400 uppercase px-1">Marketing</h2>
             {metrics.daysWithData > 0 ? (
                <div className="space-y-3">
                   <MetricCard label="Gasto en Ads" value={metrics.adSpend} isCurrency icon={Target} />
                   <div className="grid grid-cols-2 gap-3">
                      <MetricCard label="CPA" value={metrics.cpa} isCurrency />
                      <MetricCard label="ROI Ads" value={metrics.roas.toFixed(2)} suffix="x" />
                   </div>
                   <div className="p-6 bg-slate-900 rounded-3xl text-white">
                     <p className="text-[9px] font-black text-sky-400 uppercase mb-4">Métricas de Tráfico</p>
                     <div className="flex justify-between items-center"><span className="text-xs font-bold text-slate-400">Leads Totales</span><span className="text-lg font-black">{metrics.messages}</span></div>
                   </div>
                </div>
             ) : <EmptyState title="Sin actividad" description="Ingresa datos publicitarios." />}
          </div>
        )}

        {state.currentTab === 'lab' && (
          <div className="space-y-8 fade-in-fast">
             <h2 className="text-xs font-black text-slate-400 uppercase px-1">Auditoría IA</h2>
             {metrics.daysWithData === 0 ? <EmptyState title="Sin Datos" description="Añade info para analizar." /> : !diagnosis ? (
               <div className="bg-slate-900 p-8 rounded-3xl text-center"><Sparkles size={28} className="text-sky-400 mx-auto mb-4" /><h3 className="text-sm font-bold text-white mb-2 uppercase">COO Virtual Webworks</h3><button onClick={async () => { setIsLoadingDiagnosis(true); const res = await getBusinessDiagnosis(metrics, state.clients); setDiagnosis(res); setIsLoadingDiagnosis(false); }} className="w-full py-4 bg-sky-600 text-white rounded-xl text-[9px] font-bold uppercase mt-4">{isLoadingDiagnosis ? "Analizando..." : "Ejecutar Auditoría"}</button></div>
             ) : (
               <div className="space-y-4">
                 <div className={`p-6 rounded-2xl border-2 ${diagnosis.status === 'Saludable' ? 'bg-emerald-50/50 border-emerald-100' : 'bg-rose-50/50 border-rose-100'}`}><p className="text-xs font-bold text-slate-800 italic leading-relaxed">"{diagnosis.diagnosis}"</p></div>
                 <div className="bg-white border border-slate-100 p-5 rounded-2xl space-y-3"><p className="text-[9px] font-black text-sky-500 uppercase">Sugerencias</p>{diagnosis.actions.map((a, i) => <div key={i} className="flex space-x-2 text-[10px] font-bold text-slate-600"><span>•</span><p>{a}</p></div>)}</div>
                 <button onClick={() => setDiagnosis(null)} className="w-full text-[9px] font-black text-slate-300 uppercase py-4">Reiniciar Auditoría</button>
               </div>
             )}
          </div>
        )}
      </main>

      {isFilterOpen && (
        <div className="fixed inset-0 z-[1500] flex items-end justify-center px-4 pb-12 fade-in-fast">
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" onClick={() => setIsFilterOpen(false)} />
          <div className="relative w-full max-w-sm bg-white rounded-[2rem] p-6 space-y-6 premium-entrance">
            <div className="flex justify-between items-center"><h3 className="text-sm font-bold text-slate-900 uppercase">Calendario</h3><button onClick={() => setIsFilterOpen(false)} className="p-2 bg-slate-50 rounded-lg text-slate-400"><X size={16} /></button></div>
            <div className="grid grid-cols-7 gap-1 text-center">
              {getDaysInMonth(state.viewingMonth, YEAR_ACTIVE).map(day => (
                <button key={day.dayNumber} onClick={() => selectDay(day)} className={`py-3 text-[10px] font-bold rounded-lg ${getDateKey(day.date) === getDateKey(state.activeRange.start) ? 'bg-slate-900 text-white' : 'text-slate-400 hover:bg-slate-50'}`}>{day.dayNumber}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      <DataEntryPanel isOpen={isEntryOpen} onClose={() => setIsEntryOpen(false)} dateLabel={state.activeRange.label} currentData={state.dataStore[getDateKey(state.activeRange.start)]} currentClients={state.clients.filter(c => c.dateKey === getDateKey(state.activeRange.start))} onSave={handleSave} />

      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto glass border-t border-slate-100 px-8 pt-4 pb-8 flex justify-between items-center z-[150] safe-area-bottom">
        {NAVIGATION_TABS.map(tab => (
          <button key={tab.id} onClick={() => setState(prev => ({ ...prev, currentTab: tab.id }))} className={`flex flex-col items-center space-y-1 transition-all tap-feedback ${state.currentTab === tab.id ? 'scale-105' : 'opacity-30'}`}>
            <div className={`p-2 rounded-xl ${state.currentTab === tab.id ? 'bg-sky-600 text-white shadow-md' : 'text-slate-900'}`}>{tab.icon}</div>
            <span className="text-[7px] font-black uppercase tracking-widest">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
