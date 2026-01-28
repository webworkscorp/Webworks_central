
export type SelectionMode = 'dia' | 'semana' | 'quincena' | 'mes' | 'rango' | 'multi_mes';

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
  isClosed?: boolean;
}

export interface BusinessSettings {
  avgTicketValue: number;
  marginPercentage: number;
}

export interface DateRange {
  start: Date;
  end: Date;
  label: string;
  mode: SelectionMode;
}

export interface BusinessState {
  currentTab: 'dashboard' | 'finance' | 'clients_list' | 'ads' | 'lab';
  activeRange: DateRange;
  viewingMonth: number;
  viewingYear: number;
  dataStore: Record<string, DailyData>;
  clients: ClientDetail[];
  settings: BusinessSettings;
  selectedMonths?: string[]; // Array of "YYYY-MM"
}

export type DayName = 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado' | 'Domingo';

export interface CalendarDay {
  date: Date;
  dayNumber: number;
  dayName: DayName;
  weekNumber: number;
  fortnight: 1 | 2;
  isToday: boolean;
  isSelected: boolean;
}

export interface KPIReport {
  revenue: number;
  profit: number;
  cpa: number;
  roi: number;
  averageTicket: number;
}

export interface Diagnosis {
  diagnosis: string;
  risks: string;
  strengths: string;
  actions: string[];
  status: "Saludable" | "En Observación" | "Crítico";
}
