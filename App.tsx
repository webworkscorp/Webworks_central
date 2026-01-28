
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
  TrendingUp,
  ExternalLink,
  AlertCircle,
  PieChart,
  FileText,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { 
  SelectionMode, 
  CalendarDay, 
  DayName,
  BusinessState,
  DailyData,
  ClientDetail,
  Diagnosis
} from './types';
import { 
  NAVIGATION_TABS, 
  MONTH_NAMES, 
  WEEK_DAYS_SHORT
} from './constants';
import { getBusinessDiagnosis } from './services/geminiService';

// --- HELPERS ---

const getDateKey = (date: Date) => {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '2025-01-01';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'CRC',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val).replace('CRC', '₡');
};

const parseFormattedNumber = (val: string): number => {
  return parseFloat(val.replace(/[^\d]/g, '')) || 0;
};

const getDaysInMonth = (month: number, year: number): CalendarDay[] => {
  const date = new Date(year, month, 1);
  const days: CalendarDay[] = [];
  
  while (date.getMonth() === month) {
    const dayOfMonth = date.getDate();
    const dayNameIndex = (date.getDay() === 0 ? 6 : date.getDay() - 1);
    const dayName = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'][dayNameIndex] as DayName;
    
    // RESTRICCIÓN SOLICITADA: Diciembre 2025 (11, 2025) solo mostrar del 29 al 31
    // Diciembre 2026 (11, 2026) y otros meses/años se muestran completos.
    const isDec2025 = year === 2025 && month === 11;
    if (!isDec2025 || dayOfMonth >= 29) {
      days.push({
        date: new Date(date),
        dayNumber: dayOfMonth,
        dayName,
        weekNumber: Math.ceil((dayOfMonth + (new Date(year, month, 1).getDay() === 0 ? 6 : new Date(year, month, 1).getDay() - 1)) / 7),
        fortnight: dayOfMonth <= 15 ? 1 : 2,
        isToday: false,
        isSelected: false
      });
    }
    date.setDate(date.getDate() + 1);
  }
  return days;
};

// --- COMPONENTES ---

const MetricCard = React.memo(({ 
  label, 
  value, 
  isCurrency = false,
  suffix = "", 
  status = 'neutral',
  icon: Icon
}: any) => {
  const statusColors = {
    green: "text-emerald-600 bg-emerald-50",
    red: "text-rose-600 bg-rose-50",
    neutral: "text-slate-400 bg-slate-50"
  };

  const displayValue = isCurrency ? formatCurrency(value) : value.toLocaleString();

  return (
    <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm premium-entrance transition-transform duration-200 hover:scale-[1.01] will-change-transform">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
          <div className="flex items-center space-x-2">
            <span className="text-xl font-extrabold tracking-tight text-slate-900">{displayValue}{suffix}</span>
            {status !== 'neutral' && (
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${status === 'green' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                {status === 'green' ? '↑' : '↓'}
              </span>
            )}
          </div>
        </div>
        {Icon && (
          <div className={`p-2 rounded-xl ${statusColors[status]}`}>
            <Icon size={16} />
          </div>
        )}
      </div>
    </div>
  );
});

const EliteFunnel = React.memo(({ messages, sales, convRate }: any) => (
  <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm space-y-4 premium-entrance">
    <div className="flex justify-between items-end">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Embudo de Conversión</p>
      <div className="bg-sky-600 text-white text-[10px] font-black px-2 py-1 rounded-lg">
        {convRate.toFixed(1)}% CIERRE
      </div>
    </div>
    <div className="space-y-2">
      <div className="flex items-center space-x-3 bg-slate-50 p-3 rounded-2xl">
        <MessageSquare size={14} className="text-sky-500" />
        <div className="flex-1">
          <div className="flex justify-between items-center">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Leads</span>
            <span className="text-xs font-black text-slate-900">{messages}</span>
          </div>
          <div className="w-full h-1.5 bg-slate-200 rounded-full mt-1 overflow-hidden">
            <div className="h-full bg-sky-500 rounded-full transition-all duration-700 ease-out" style={{ width: '100%' }} />
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-3 bg-slate-50 p-3 rounded-2xl">
        <ShoppingBag size={14} className="text-emerald-500" />
        <div className="flex-1">
          <div className="flex justify-between items-center">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Ventas</span>
            <span className="text-xs font-black text-slate-900">{sales}</span>
          </div>
          <div className="w-full h-1.5 bg-slate-200 rounded-full mt-1 overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full transition-all duration-700 ease-out" style={{ width: `${convRate}%` }} />
          </div>
        </div>
      </div>
    </div>
  </div>
));

const EmptyState = ({ title, description, icon: Icon }: any) => (
  <div className="flex flex-col items-center justify-center py-16 px-8 text-center bg-white/50 border border-slate-100 rounded-3xl premium-entrance">
    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-slate-300 shadow-sm border border-slate-50 mb-4">
      {Icon ? <Icon size={20} /> : <Layers size={20} />}
    </div>
    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight mb-1">{title}</h3>
    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">{description}</p>
  </div>
);

const DataEntryPanel = ({ isOpen, onClose, dateLabel, currentData, currentClients, onSave }: any) => {
  const [inputs, setInputs] = useState({
    messages: '',
    sales: '',
    adSpend: '',
    clientsClosed: ''
  });
  const [clientDetails, setClientDetails] = useState<Partial<ClientDetail>[]>([]);

  useEffect(() => {
    if (isOpen) {
      setInputs({
        messages: currentData?.messages?.toString() || '',
        sales: currentData?.sales?.toString() || '',
        adSpend: currentData?.adSpend?.toString() || '',
        clientsClosed: currentData?.clientsClosed?.toString() || '0'
      });
      setClientDetails(currentClients && currentClients.length > 0 ? currentClients : []);
    }
  }, [currentData, currentClients, isOpen]);

  useEffect(() => {
    const closedCount = parseInt(inputs.clientsClosed) || 0;
    if (closedCount > clientDetails.length) {
      const diff = closedCount - clientDetails.length;
      const newClients = Array.from({ length: diff }).map(() => ({ 
        name: '', 
        amount: 0, 
        status: 'entregado' as const, 
        link: '' 
      }));
      setClientDetails([...clientDetails, ...newClients]);
    } else if (closedCount < clientDetails.length) {
      setClientDetails(clientDetails.slice(0, closedCount));
    }
  }, [inputs.clientsClosed]);

  const handleNumericChange = useCallback((field: string, val: string) => {
    const isCurrencyField = field === 'adSpend';
    if (isCurrencyField) {
      const numeric = parseFormattedNumber(val);
      setInputs(p => ({ ...p, [field]: numeric.toString() }));
    } else {
      const cleanVal = val.replace(/[^\d]/g, '');
      setInputs(p => ({ ...p, [field]: cleanVal }));
    }
  }, []);

  const isFormIncomplete = useMemo(() => {
    const mainFieldsValid = inputs.messages !== '' && inputs.sales !== '' && inputs.adSpend !== '';
    const clientsValid = clientDetails.every(c => c.name && c.name.trim() !== '');
    return !mainFieldsValid || !clientsValid;
  }, [inputs, clientDetails]);

  const handleSave = () => {
    if (isFormIncomplete) return;
    const daily: DailyData = {
      messages: parseInt(inputs.messages) || 0,
      sales: parseInt(inputs.sales) || 0,
      adSpend: parseInt(inputs.adSpend) || 0,
      clientsClosed: parseInt(inputs.clientsClosed) || 0
    };
    onSave(daily, clientDetails);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center px-4 pb-8 sm:p-4 overflow-hidden fade-in-fast">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] premium-entrance">
        <div className="px-6 pt-8 pb-4 flex justify-between items-center border-b border-slate-50">
          <div>
            <h3 className="text-lg font-bold text-slate-900 uppercase tracking-tight">Registro Diario</h3>
            <p className="text-[9px] font-bold text-sky-500 uppercase tracking-widest mt-1">{dateLabel}</p>
          </div>
          <button onClick={onClose} className="p-2.5 bg-slate-50 rounded-xl text-slate-400 active:scale-90 transition-all"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
          <div className="grid gap-3">
            {[
              { label: 'Leads / Mensajes', field: 'messages', icon: <MessageSquare size={14} />, isCurrency: false },
              { label: 'Ventas Cerradas', field: 'sales', icon: <ShoppingBag size={14} />, isCurrency: false },
              { label: 'Gasto Ads', field: 'adSpend', icon: <Target size={14} />, isCurrency: true },
              { label: 'Cierres Agendados', field: 'clientsClosed', icon: <Users size={14} />, isCurrency: false }
            ].map(item => (
              <div key={item.field} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 focus-within:bg-white focus-within:ring-2 focus-within:ring-sky-100 transition-all">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">{item.label}*</label>
                <div className="flex items-center space-x-3">
                  <span className="text-slate-300">{item.icon}</span>
                  <input 
                    type="text" 
                    inputMode="numeric"
                    value={item.isCurrency ? formatCurrency(parseInt(inputs[item.field as keyof typeof inputs] || '0')) : (inputs[item.field as keyof typeof inputs])} 
                    onChange={e => handleNumericChange(item.field, e.target.value)}
                    className="w-full bg-transparent text-lg font-extrabold text-slate-900 focus:outline-none placeholder:text-slate-200"
                    placeholder={item.isCurrency ? "₡0" : "0"}
                  />
                </div>
              </div>
            ))}
          </div>

          {clientDetails.length > 0 && (
            <div className="space-y-4 pt-2">
              <h4 className="text-[9px] font-black text-slate-300 uppercase tracking-widest px-1">Detalle de Proyectos</h4>
              {clientDetails.map((client, idx) => (
                <div key={idx} className="p-5 rounded-2xl border border-slate-100 bg-white shadow-sm space-y-4 premium-entrance">
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Nombre y Proyecto*</label>
                    <input 
                      type="text" 
                      placeholder="Ej. Juan - E-commerce" 
                      value={client.name} 
                      onChange={e => { const next = [...clientDetails]; next[idx].name = e.target.value; setClientDetails(next); }}
                      className="w-full text-base font-bold text-slate-900 bg-white border-b border-slate-100 pb-2 focus:outline-none focus:border-sky-400 placeholder:text-slate-200"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Link de Proyecto</label>
                    <input 
                      type="text" 
                      placeholder="proyecto.com" 
                      value={client.link} 
                      onChange={e => { const next = [...clientDetails]; next[idx].link = e.target.value; setClientDetails(next); }}
                      className="w-full text-base font-bold text-sky-500 bg-white border-b border-slate-100 pb-2 focus:outline-none focus:border-sky-400 placeholder:text-slate-200"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Monto Recibido (₡)</label>
                    <input 
                      type="text" 
                      inputMode="numeric"
                      placeholder="₡0" 
                      value={formatCurrency(client.amount || 0)} 
                      onChange={e => {
                        const next = [...clientDetails];
                        next[idx].amount = parseFormattedNumber(e.target.value);
                        setClientDetails(next);
                      }}
                      className="w-full text-base font-bold text-slate-900 bg-white border-b border-slate-100 pb-2 focus:outline-none focus:border-sky-400 placeholder:text-slate-200"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 bg-white border-t border-slate-50 space-y-3">
          {isFormIncomplete && (
            <div className="flex items-center space-x-2 text-[9px] font-bold text-rose-500 uppercase tracking-widest justify-center bg-rose-50 py-2 rounded-lg">
              <AlertCircle size={10} />
              <span>Completa los campos obligatorios (*)</span>
            </div>
          )}
          <button 
            onClick={handleSave} 
            disabled={isFormIncomplete}
            className={`w-full py-4 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] active:scale-95 transition-all shadow-md tap-feedback ${isFormIncomplete ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none' : 'bg-slate-900 text-white'}`}
          >
            Sincronizar Cloud
          </button>
        </div>
      </div>
    </div>
  );
};

// --- APP PRINCIPAL ---

export default function App() {
  const [state, setState] = useState<BusinessState>(() => {
    // ESTADO INICIAL: Diciembre 29, 2025
    const initialMonth = 11; // Diciembre
    const initialDay = 29;
    const initialYear = 2025;
    
    const defaultState: BusinessState = {
      currentTab: 'dashboard',
      viewingMonth: initialMonth,
      viewingYear: initialYear,
      activeRange: {
        start: new Date(initialYear, initialMonth, initialDay),
        end: new Date(initialYear, initialMonth, initialDay),
        label: `${initialDay} ${MONTH_NAMES[initialMonth]} ${initialYear}`,
        mode: 'dia'
      },
      dataStore: {},
      clients: [],
      settings: { avgTicketValue: 45000, marginPercentage: 0.65 }
    };

    try {
      const saved = localStorage.getItem('bl_v11_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        return { 
          ...defaultState,
          ...parsed, 
          activeRange: parsed.activeRange ? { 
            ...parsed.activeRange, 
            start: new Date(parsed.activeRange.start), 
            end: new Date(parsed.activeRange.end) 
          } : defaultState.activeRange
        };
      }
    } catch (e) { console.error("Error loading data:", e); }
    return defaultState;
  });

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isEntryOpen, setIsEntryOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date(state.activeRange.start));
  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null);
  const [isLoadingDiagnosis, setIsLoadingDiagnosis] = useState(false);

  useEffect(() => { 
    localStorage.setItem('bl_v11_data', JSON.stringify(state)); 
  }, [state]);

  const metrics = useMemo(() => {
    const start = state.activeRange.start;
    const end = state.activeRange.end;
    let totals = { messages: 0, sales: 0, adSpend: 0, daysWithData: 0 };
    
    try {
      const iter = new Date(start);
      let safety = 0;
      while (iter <= end && safety < 1000) {
        const key = getDateKey(iter);
        const data = state.dataStore[key];
        if (data) {
          totals.messages += (data.messages || 0);
          totals.sales += (data.sales || 0);
          totals.adSpend += (data.adSpend || 0);
          totals.daysWithData++;
        }
        iter.setDate(iter.getDate() + 1);
        safety++;
      }
    } catch (e) {}

    const filteredClients = state.clients.filter(c => {
      try {
        const d = new Date(c.dateKey + 'T00:00:00');
        return d >= start && d <= end;
      } catch(e) { return false; }
    });

    const revenue = filteredClients.reduce((acc, c) => acc + (c.amount || 0), 0);
    const avgTicket = filteredClients.length > 0 ? revenue / filteredClients.length : 0;
    const profit = revenue - totals.adSpend;
    const marginPercent = revenue > 0 ? (profit / revenue) * 100 : 0;
    const adCostPercent = revenue > 0 ? (totals.adSpend / revenue) * 100 : 0;

    return { 
      ...totals, 
      revenue, 
      filteredClients,
      avgTicket,
      profit,
      marginPercent,
      adCostPercent,
      convRate: totals.messages > 0 ? (totals.sales / totals.messages) * 100 : 0,
      cpa: totals.sales > 0 ? totals.adSpend / totals.sales : 0,
      roi: totals.adSpend > 0 ? revenue / totals.adSpend : 0
    };
  }, [state.activeRange, state.dataStore, state.clients]);

  const selectDay = useCallback((day: CalendarDay) => {
    setSelectedDate(day.date);
    setState(prev => ({
      ...prev,
      activeRange: {
        start: day.date,
        end: day.date,
        label: `${day.dayNumber} ${MONTH_NAMES[day.date.getMonth()]} ${day.date.getFullYear()}`,
        mode: 'dia'
      }
    }));
    setIsFilterOpen(false);
  }, []);

  const changeViewingMonth = useCallback((direction: 'next' | 'prev') => {
    setState(prev => {
      let nextMonth = prev.viewingMonth;
      let nextYear = prev.viewingYear;
      
      if (direction === 'next') {
        if (nextMonth === 11) {
          nextMonth = 0;
          nextYear++;
        } else {
          nextMonth++;
        }
      } else {
        if (nextMonth === 0) {
          nextMonth = 11;
          nextYear--;
        } else {
          nextMonth--;
        }
      }

      // Restricción: No navegar antes de Diciembre 2025
      if (nextYear < 2025 || (nextYear === 2025 && nextMonth < 11)) {
        return prev;
      }

      return { ...prev, viewingMonth: nextMonth, viewingYear: nextYear };
    });
  }, []);

  const handleSaveData = useCallback((daily: DailyData, clientDetails: Partial<ClientDetail>[]) => {
    const key = getDateKey(selectedDate);
    
    const processedClients: ClientDetail[] = clientDetails.map((c, idx) => ({
      id: c.id || `${key}-${Date.now()}-${idx}`,
      name: c.name || '',
      amount: c.amount || 0,
      status: c.status || 'entregado',
      link: c.link || '',
      dateKey: key
    }));

    setState(prev => {
      const otherClients = prev.clients.filter(c => c.dateKey !== key);
      return {
        ...prev,
        dataStore: {
          ...prev.dataStore,
          [key]: daily
        },
        clients: [...otherClients, ...processedClients]
      };
    });
    
    setIsEntryOpen(false);
  }, [selectedDate]);

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-[#FBFBFD] text-slate-900 overflow-hidden relative border-x border-slate-50 shadow-2xl">
      
      {/* HEADER */}
      <header className="glass border-b border-slate-100 px-6 pt-10 pb-6 sticky top-0 z-[100]">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm overflow-hidden border border-slate-100">
              <img src="https://i.imgur.com/HrmZvvG.png" alt="Webworks CORP Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-sm font-black uppercase tracking-widest text-slate-800">Webworks CORP</h1>
              <p className="text-[8px] font-bold text-sky-500 uppercase tracking-widest mt-0.5">V11 Operations</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={() => setIsEntryOpen(true)}
            className="p-3.5 bg-sky-600 text-white rounded-xl shadow-lg active:scale-90 transition-all flex items-center justify-center tap-feedback z-[110]"
          >
            <Plus size={18} strokeWidth={3} />
          </button>
        </div>

        <button 
          onClick={() => setIsFilterOpen(true)} 
          className="w-full flex items-center justify-between bg-white border border-slate-100 rounded-xl px-4 py-3 shadow-sm active:bg-slate-50 transition-colors"
        >
          <div className="flex items-center space-x-3 text-slate-700">
            <CalendarIcon size={14} className="text-sky-600" />
            <span className="text-xs font-bold">{state.activeRange.label}</span>
          </div>
          <ChevronDown size={12} className="text-slate-300" />
        </button>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 overflow-y-auto px-6 pt-6 pb-32 space-y-8 no-scrollbar scroll-smooth">
        
        {state.currentTab === 'dashboard' && (
          <div className="space-y-6 fade-in-fast">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Resumen Operativo</h2>
            
            {metrics.daysWithData === 0 && metrics.filteredClients.length === 0 ? (
              <EmptyState title="Sin Datos" description="Pulsa (+) para añadir info diaria." icon={Layers} />
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <MetricCard label="Mensajes" value={metrics.messages} icon={MessageSquare} />
                  <MetricCard label="Ventas" value={metrics.sales} icon={ShoppingBag} />
                </div>
                <MetricCard label="Inversión Ads" value={metrics.adSpend} isCurrency icon={Target} />
                <MetricCard label="Ganancia Neta" value={metrics.profit} isCurrency status={metrics.profit >= 0 ? 'green' : 'red'} icon={Wallet} />
                <MetricCard label="Facturación" value={metrics.revenue} isCurrency icon={TrendingUp} />
                <EliteFunnel messages={metrics.messages} sales={metrics.sales} convRate={metrics.convRate} />
              </div>
            )}
          </div>
        )}

        {state.currentTab === 'finance' && (
          <div className="space-y-6 fade-in-fast">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">Finanzas Ejecutivas</h2>
              <div className="flex items-center space-x-1 px-2 py-1 bg-sky-50 rounded-lg border border-sky-100/50">
                <PieChart size={10} className="text-sky-600" />
                <span className="text-[8px] font-black text-sky-600 uppercase tracking-widest">Reporte Consolidado</span>
              </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6 premium-entrance">
              <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-sky-50 rounded-lg text-sky-600"><FileText size={16} /></div>
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-tight">Estado de Resultados</h3>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center group">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Ingresos Brutos</p>
                  <span className="text-sm font-black text-slate-900">{formatCurrency(metrics.revenue)}</span>
                </div>
                <div className="flex justify-between items-center group">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Gasto Operativo (Ads)</p>
                  <span className="text-sm font-black text-rose-500">({formatCurrency(metrics.adSpend)})</span>
                </div>
                <div className="h-px bg-slate-50 w-full" />
                <div className="flex justify-between items-center group bg-slate-50 p-4 rounded-2xl">
                  <p className="text-[9px] font-black text-slate-900 uppercase tracking-wider">Utilidad Neta</p>
                  <span className={`text-base font-black ${metrics.profit >= 0 ? 'text-sky-600' : 'text-rose-600'}`}>
                    {formatCurrency(metrics.profit)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {state.currentTab === 'clients_list' && (
          <div className="space-y-6 fade-in-fast">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">Gestión de Clientes</h2>
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{metrics.filteredClients.length} Operaciones</span>
            </div>
            
            {metrics.filteredClients.length === 0 ? (
              <EmptyState title="Sin Cierres" description="No hay transacciones registradas." icon={Users} />
            ) : (
              <div className="space-y-3">
                {metrics.filteredClients.map(client => (
                  <div key={client.id} className="bg-white border border-slate-100 p-4 rounded-2xl flex items-center justify-between shadow-sm premium-entrance hover:border-sky-200 transition-all duration-300 group">
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="w-10 h-10 bg-slate-50 text-slate-900 rounded-xl flex items-center justify-center text-xs font-black shrink-0 border border-slate-100 group-hover:bg-sky-50 group-hover:text-sky-600 transition-colors">
                        {client.name ? client.name.charAt(0) : '?'}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <h4 className="text-xs font-bold text-slate-800 truncate group-hover:text-sky-700 transition-colors">{client.name}</h4>
                        <div className="flex items-center space-x-2 mt-0.5">
                          <span className="text-[7px] bg-slate-50 text-slate-400 px-1.5 py-0.5 rounded font-black uppercase">{client.dateKey.split('-').reverse().slice(0,2).join('/')}</span>
                          <p className="text-[10px] font-black text-slate-900">{formatCurrency(client.amount)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end shrink-0 space-y-2">
                      <span className="px-2 py-0.5 rounded-md text-[7px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-100">CERRADO</span>
                      {client.link && (
                        <a href={client.link.startsWith('http') ? client.link : `https://${client.link}`} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-slate-50 text-slate-400 rounded-lg hover:bg-sky-50 hover:text-sky-600 transition-all border border-slate-100">
                          <ExternalLink size={10} />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {state.currentTab === 'ads' && (
          <div className="space-y-6 fade-in-fast">
             <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Marketing & Tráfico</h2>
             {metrics.daysWithData > 0 ? (
                <div className="space-y-3">
                   <MetricCard label="Gasto en Ads" value={metrics.adSpend} isCurrency icon={Target} />
                   <div className="grid grid-cols-2 gap-3">
                      <MetricCard label="CPA" value={metrics.cpa.toFixed(0)} isCurrency />
                      <MetricCard label="ROI Directo" value={metrics.roi.toFixed(2)} suffix="x" />
                   </div>
                </div>
             ) : <EmptyState title="Sin actividad" description="Ingresa datos publicitarios para ver KPIs." />}
          </div>
        )}

        {state.currentTab === 'lab' && (
          <div className="space-y-8 fade-in-fast">
             <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Auditoría IA</h2>
             {metrics.daysWithData === 0 && metrics.filteredClients.length === 0 ? (
              <EmptyState title="Sin Auditoría" description="Registra datos para procesar el diagnóstico." icon={BrainCircuit} />
            ) : !diagnosis ? (
              <div className="bg-slate-900 p-8 rounded-3xl shadow-xl text-center premium-entrance">
                <Sparkles size={28} className="text-sky-400 mx-auto mb-4" />
                <h3 className="text-sm font-bold text-white mb-2 uppercase tracking-widest">Diagnóstico Gemini 3</h3>
                <button onClick={async () => {
                    setIsLoadingDiagnosis(true);
                    try {
                      const res = await getBusinessDiagnosis({
                        revenue: metrics.revenue, profit: metrics.profit, cpa: metrics.cpa, roi: metrics.roi, averageTicket: metrics.avgTicket
                      }, metrics.filteredClients);
                      setDiagnosis(res);
                    } catch(e) { console.error(e); }
                    setIsLoadingDiagnosis(false);
                  }} disabled={isLoadingDiagnosis} className="w-full py-4 bg-sky-600 text-white rounded-xl text-[9px] font-bold uppercase active:scale-95 transition-all">
                  {isLoadingDiagnosis ? "Procesando..." : "Ejecutar Diagnóstico"}
                </button>
              </div>
            ) : (
              <div className="space-y-4 premium-entrance">
                <div className={`p-6 rounded-2xl border-2 ${diagnosis.status === 'Saludable' ? 'bg-emerald-50/50 border-emerald-100' : 'bg-rose-50/50 border-rose-100'}`}>
                   <p className="text-xs font-bold text-slate-800 italic">"{diagnosis.diagnosis}"</p>
                </div>
                <button onClick={() => setDiagnosis(null)} className="w-full text-[9px] font-black text-slate-300 uppercase py-4">Volver a Analizar</button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* NAVEGADOR CALENDARIO */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-[1500] flex items-end justify-center px-4 pb-12 fade-in-fast">
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" onClick={() => setIsFilterOpen(false)} />
          <div className="relative w-full max-w-sm bg-white rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[80vh] premium-entrance">
            <div className="px-6 pt-8 pb-4 flex justify-between items-center border-b border-slate-50">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tighter">Navegador</h3>
              <button onClick={() => setIsFilterOpen(false)} className="p-2 bg-slate-50 rounded-lg text-slate-400 active:scale-90 transition-all"><X size={16} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
              {/* Selector de Mes */}
              <div className="flex items-center justify-between border border-slate-100 p-3 rounded-xl bg-slate-50/50">
                <button 
                  onClick={() => changeViewingMonth('prev')} 
                  className="p-2 hover:bg-white rounded-lg transition-all active:scale-90 shadow-sm border border-transparent hover:border-slate-100"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{MONTH_NAMES[state.viewingMonth]} {state.viewingYear}</span>
                <button 
                  onClick={() => changeViewingMonth('next')} 
                  className="p-2 hover:bg-white rounded-lg transition-all active:scale-90 shadow-sm border border-transparent hover:border-slate-100"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Grid del Calendario */}
              <div className="grid grid-cols-7 gap-y-1 text-center">
                {WEEK_DAYS_SHORT.map(d => <span key={d} className="text-[8px] font-black text-slate-300 uppercase pb-2">{d}</span>)}
                {(() => {
                  const days = getDaysInMonth(state.viewingMonth, state.viewingYear);
                  if (days.length === 0) return null;
                  const firstDayInGrid = days[0].date.getDay();
                  const offset = firstDayInGrid === 0 ? 6 : firstDayInGrid - 1;
                  return Array.from({ length: offset }).map((_, i) => <div key={`pad-${i}`} />);
                })()}
                {getDaysInMonth(state.viewingMonth, state.viewingYear).map(day => {
                  const key = getDateKey(day.date);
                  const hasData = !!state.dataStore[key];
                  const isSelected = getDateKey(selectedDate) === key;
                  return (
                    <button 
                      key={day.dayNumber} 
                      onClick={() => selectDay(day)} 
                      className={`group relative py-3.5 flex flex-col items-center rounded-lg transition-all active:scale-90 ${isSelected ? 'bg-slate-900 text-white shadow-lg' : hasData ? 'text-sky-600 bg-sky-50/50' : 'text-slate-400 hover:bg-slate-50'}`}
                    >
                      <span className="text-[10px] font-bold">{day.dayNumber}</span>
                      {hasData && !isSelected && <div className="absolute bottom-1 w-1 h-1 bg-sky-500 rounded-full" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL REGISTRO */}
      <DataEntryPanel 
        isOpen={isEntryOpen} onClose={() => setIsEntryOpen(false)} 
        dateLabel={selectedDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        currentData={state.dataStore[getDateKey(selectedDate)]}
        currentClients={state.clients.filter(c => c.dateKey === getDateKey(selectedDate))}
        onSave={handleSaveData}
      />

      {/* BARRA NAVEGACIÓN */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto glass border-t border-slate-100 px-8 pt-4 pb-10 flex justify-between items-center z-[150] safe-area-bottom">
        {NAVIGATION_TABS.map(tab => {
          const isActive = state.currentTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setState(prev => ({ ...prev, currentTab: tab.id }))} className={`flex flex-col items-center space-y-1 transition-all duration-200 tap-feedback ${isActive ? 'scale-105' : 'opacity-30'}`}>
              <div className={`p-2.5 rounded-xl transition-all duration-200 ${isActive ? 'bg-sky-600 text-white shadow-lg' : 'text-slate-900'}`}>{tab.icon}</div>
              <span className="text-[7px] font-black uppercase tracking-widest">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
