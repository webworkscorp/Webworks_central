
import React from 'react';
import { 
  LayoutDashboard, 
  CreditCard, 
  Target, 
  Beaker
} from 'lucide-react';

export const NAVIGATION_TABS = [
  { id: 'dashboard', icon: <LayoutDashboard size={20} />, label: 'Resumen' },
  { id: 'clients', icon: <CreditCard size={20} />, label: 'Finanzas' },
  { id: 'ads', icon: <Target size={20} />, label: 'Marketing' },
  { id: 'lab', icon: <Beaker size={20} />, label: 'Auditoría' },
] as const;

export const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const WEEK_DAYS_SHORT = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export const YEAR_ACTIVE = 2026;

export const PRESET_FILTERS = [
  { id: 'hoy', label: 'Hoy' },
  { id: 'semana', label: 'Esta Semana' },
  { id: 'quincena', label: 'Quincena' },
  { id: 'mes', label: 'Mes Completo' },
];
