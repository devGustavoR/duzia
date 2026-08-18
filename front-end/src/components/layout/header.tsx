'use client';

import { Calendar } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  selectedMonth?: number;
  selectedYear?: number;
  allowAllMonths?: boolean;
  onMonthChange?: (month: number, year: number) => void;
}

const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

export function Header({
  title,
  subtitle,
  selectedMonth,
  selectedYear,
  allowAllMonths,
  onMonthChange,
}: HeaderProps) {
  const currentMonth = selectedMonth !== undefined ? selectedMonth : new Date().getMonth() + 1;
  const currentYear = selectedYear || new Date().getFullYear();

  const handlePrevMonth = () => {
    if (!onMonthChange) return;
    if (currentMonth === 0) {
      onMonthChange(12, currentYear - 1);
      return;
    }
    let newM = currentMonth - 1;
    let newY = currentYear;
    if (newM < 1) {
      newM = 12;
      newY -= 1;
    }
    onMonthChange(newM, newY);
  };

  const handleNextMonth = () => {
    if (!onMonthChange) return;
    if (currentMonth === 0) {
      onMonthChange(1, currentYear);
      return;
    }
    let newM = currentMonth + 1;
    let newY = currentYear;
    if (newM > 12) {
      newM = 1;
      newY += 1;
    }
    onMonthChange(newM, newY);
  };

  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-white/10">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-[#94a3b8] mt-0.5">{subtitle}</p>}
      </div>

      {onMonthChange && (
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 shadow-sm">
          <button
            onClick={handlePrevMonth}
            className="text-slate-400 hover:text-white transition-colors px-1 text-sm font-bold"
            title="Mês Anterior"
          >
            ‹
          </button>

          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
            <Calendar className="h-3.5 w-3.5 text-[#ea2a33]" />
            <select
              value={currentMonth}
              onChange={(e) => onMonthChange(parseInt(e.target.value, 10), currentYear)}
              className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
            >
              {allowAllMonths && <option value={0} className="bg-[#050505] text-white">Todos os Meses</option>}
              {MONTH_NAMES.map((name, idx) => (
                <option key={idx + 1} value={idx + 1} className="bg-[#050505] text-white">
                  {name} {currentYear}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleNextMonth}
            className="text-slate-400 hover:text-white transition-colors px-1 text-sm font-bold"
            title="Próximo Mês"
          >
            ›
          </button>
        </div>
      )}
    </header>
  );
}
