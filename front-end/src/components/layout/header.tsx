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
    <header
      className={`${
        onMonthChange ? 'flex' : 'hidden md:flex'
      } flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-4 mb-4 sm:pb-6 sm:mb-6 sm:border-b sm:border-white/10`}
    >
      {/* Title block: the mobile app bar already shows the screen name */}
      <div className="hidden md:block">
        <h1 className="text-2xl font-black text-white tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-[#94a3b8] mt-0.5">{subtitle}</p>}
      </div>

      {onMonthChange && (
        <div className="flex items-center justify-between gap-2 bg-white/5 border border-white/10 rounded-xl px-2 py-2 sm:px-3 sm:py-1.5 shadow-sm w-full sm:w-auto">
          <button
            onClick={handlePrevMonth}
            className="text-slate-300 hover:text-white transition-colors h-9 w-9 sm:h-auto sm:w-auto grid place-items-center rounded-lg text-lg sm:text-sm font-bold"
            title="Mês Anterior"
          >
            ‹
          </button>

          <div className="flex items-center gap-1.5 text-sm sm:text-xs font-semibold text-slate-200">
            <Calendar className="h-4 w-4 sm:h-3.5 sm:w-3.5 text-[#ea2a33]" />
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
            className="text-slate-300 hover:text-white transition-colors h-9 w-9 sm:h-auto sm:w-auto grid place-items-center rounded-lg text-lg sm:text-sm font-bold"
            title="Próximo Mês"
          >
            ›
          </button>
        </div>
      )}
    </header>
  );
}
