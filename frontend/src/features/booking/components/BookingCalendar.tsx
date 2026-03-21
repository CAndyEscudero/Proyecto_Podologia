import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import type { Dayjs } from "dayjs";
import clsx from "clsx";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { BookingCalendarProps } from "../types/booking.types";

const WEEK_DAYS = ["L", "M", "M", "J", "V", "S", "D"];
const MONTH_NAMES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export function BookingCalendar({ value, onChange, minDate, maxDate }: BookingCalendarProps) {
  const min = dayjs(minDate).startOf("day");
  const max = dayjs(maxDate).startOf("day");
  const selectedDate: Dayjs | null = value ? dayjs(value) : null;
  const initialMonth = selectedDate?.isValid() ? selectedDate.startOf("month") : min.startOf("month");
  const [viewMonth, setViewMonth] = useState(initialMonth);

  useEffect(() => {
    if (selectedDate?.isValid()) {
      setViewMonth(selectedDate.startOf("month"));
    }
  }, [value]);

  const startOfMonth = viewMonth.startOf("month");
  const daysInMonth = startOfMonth.daysInMonth();
  const offset = (startOfMonth.day() + 6) % 7;
  const cells: Array<Dayjs | null> = [];

  for (let i = 0; i < offset; i += 1) {
    cells.push(null);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(startOfMonth.date(day));
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  const canGoPrev =
    viewMonth.subtract(1, "month").endOf("month").isSame(min, "day") ||
    viewMonth.subtract(1, "month").endOf("month").isAfter(min, "day");
  const canGoNext =
    viewMonth.add(1, "month").startOf("month").isBefore(max, "day") ||
    viewMonth.add(1, "month").startOf("month").isSame(max, "day");

  return (
    <div
      data-testid="booking-calendar"
      className="w-full rounded-[1rem] border border-rose-200/80 bg-gradient-to-b from-rose-50 via-white to-white p-2 shadow-[0_18px_40px_-30px_rgba(148,72,90,0.45)] ring-1 ring-white/70 md:p-[0.6rem]"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-brand-wine">Calendario</p>
          <p className="mt-0.5 font-display text-[0.94rem] text-brand-ink md:text-[1.04rem]">
            {MONTH_NAMES[viewMonth.month()]} {viewMonth.year()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CalendarNavButton
            disabled={!canGoPrev}
            onClick={() => canGoPrev && setViewMonth((current) => current.subtract(1, "month"))}
            label="Mes anterior"
            testId="booking-calendar-prev"
          >
            <ChevronLeft size={16} />
          </CalendarNavButton>
          <CalendarNavButton
            disabled={!canGoNext}
            onClick={() => canGoNext && setViewMonth((current) => current.add(1, "month"))}
            label="Mes siguiente"
            testId="booking-calendar-next"
          >
            <ChevronRight size={16} />
          </CalendarNavButton>
        </div>
      </div>

      <div className="mt-1.5 grid grid-cols-7 gap-0.5 text-center">
        {WEEK_DAYS.map((day, index) => (
          <div key={`${day}-${index}`} className="py-0.5 text-[8px] font-extrabold uppercase tracking-[0.1em] text-slate-400 md:text-[9px]">
            {day}
          </div>
        ))}
        {cells.map((date, index) => {
          if (!date) {
            return <div key={`empty-${index}`} className="aspect-square rounded-xl bg-transparent md:aspect-[1/0.84]" />;
          }

          const isBeforeMin = date.isBefore(min, "day");
          const isAfterMax = date.isAfter(max, "day");
          const isDisabled = isBeforeMin || isAfterMax;
          const isSelected = selectedDate?.isSame(date, "day");
          const isToday = date.isSame(dayjs(), "day");

          return (
            <button
              key={date.format("YYYY-MM-DD")}
              type="button"
              disabled={isDisabled}
              onClick={() => onChange(date.format("YYYY-MM-DD"))}
              data-testid={`booking-date-${date.format("YYYY-MM-DD")}`}
              aria-label={`Seleccionar ${date.format("YYYY-MM-DD")}`}
              className={clsx(
                "aspect-square rounded-[0.72rem] border text-[10px] font-bold transition md:aspect-[1/0.84] md:text-[11px]",
                isSelected &&
                  "border-brand-rose bg-gradient-to-br from-[#a96f7d] to-[#bf8795] text-white shadow-[0_18px_30px_-18px_rgba(169,111,125,0.9)]",
                !isSelected &&
                  !isDisabled &&
                  "border-rose-100/90 bg-white/95 text-brand-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] hover:-translate-y-0.5 hover:border-brand-rose hover:text-brand-wine hover:shadow-[0_14px_24px_-20px_rgba(148,72,90,0.45)]",
                isDisabled && "cursor-not-allowed border-transparent bg-rose-50/45 text-slate-300",
                isToday && !isSelected && "border-brand-wine/25 bg-rose-50/60 ring-1 ring-brand-wine/10"
              )}
              >
              <span className="flex h-full flex-col items-center justify-center gap-px leading-none">
                <span>{date.date()}</span>
                {isToday ? <span className="text-[6px] uppercase tracking-wide">Hoy</span> : null}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-1 flex flex-wrap gap-2 text-[8.5px] text-slate-500 md:text-[9px]">
        <span className="inline-flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-rose" />
          Fecha seleccionada
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full border border-rose-200 bg-white" />
          Disponible para reserva
        </span>
      </div>
    </div>
  );
}

interface CalendarNavButtonProps {
  children: ReactNode;
  disabled: boolean;
  onClick: () => void;
  label: string;
  testId: string;
}

function CalendarNavButton({ children, disabled, onClick, label, testId }: CalendarNavButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      data-testid={testId}
      disabled={disabled}
      onClick={onClick}
      className={clsx(
        "inline-flex h-6.5 w-6.5 items-center justify-center rounded-full border shadow-[0_10px_18px_-16px_rgba(148,72,90,0.7)] transition md:h-7 md:w-7",
        disabled
          ? "cursor-not-allowed border-rose-100 bg-white/60 text-slate-300"
          : "border-rose-200 bg-white/95 text-brand-ink hover:-translate-y-0.5 hover:border-brand-rose hover:text-brand-wine"
      )}
    >
      {children}
    </button>
  );
}
