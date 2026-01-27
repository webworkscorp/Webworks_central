
import React from 'react';
import { 
  LayoutDashboard, 
  CreditCard, 
  Target, 
  Beaker,
  Users
} from 'lucide-react';

export const NAVIGATION_TABS = [
  { id: 'dashboard', icon: <LayoutDashboard size={18} />, label: 'Resumen' },
  { id: 'finance', icon: <CreditCard size={18} />, label: 'Finanzas' },
  { id: 'clients_list', icon: <Users size={18} />, label: 'Clientes' },
  { id: 'ads', icon: <Target size={18} />, label: 'Marketing' },
  { id: 'lab', icon: <Beaker size={18} />, label: 'Auditoría' },
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
