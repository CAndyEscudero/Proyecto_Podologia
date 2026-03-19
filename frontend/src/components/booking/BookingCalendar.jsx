import { useEffect, useState } from "react";
import dayjs from "dayjs";
import clsx from "clsx";
import { ChevronLeft, ChevronRight } from "lucide-react";

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

export function BookingCalendar({ value, onChange, minDate, maxDate }) {
  const min = dayjs(minDate).startOf("day");
  const max = dayjs(maxDate).startOf("day");
  const selectedDate = value ? dayjs(value) : null;
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
  const cells = [];

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
      className="rounded-[1.5rem] border border-rose-200/80 bg-gradient-to-b from-rose-50/90 to-white p-3.5 shadow-sm md:p-4"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-brand-wine">Calendario</p>
          <p className="mt-1 font-display text-xl text-brand-ink md:text-2xl">
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

      <div className="mt-4 grid grid-cols-7 gap-1.5 text-center md:gap-2">
        {WEEK_DAYS.map((day, index) => (
          <div key={`${day}-${index}`} className="py-1.5 text-[11px] font-extrabold uppercase tracking-[0.14em] text-slate-400 md:text-xs">
            {day}
          </div>
        ))}
        {cells.map((date, index) => {
          if (!date) {
            return <div key={`empty-${index}`} className="aspect-square rounded-xl bg-transparent" />;
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
                "aspect-square rounded-xl border text-[13px] font-bold transition md:text-sm",
                isSelected && "border-brand-rose bg-brand-rose text-white shadow-lg shadow-rose-200/60",
                !isSelected &&
                  !isDisabled &&
                  "border-rose-100 bg-white text-brand-ink hover:-translate-y-0.5 hover:border-brand-rose hover:text-brand-wine",
                isDisabled && "cursor-not-allowed border-transparent bg-rose-50/40 text-slate-300",
                isToday && !isSelected && "border-brand-wine/20 ring-1 ring-brand-wine/15"
              )}
            >
              <span className="flex h-full flex-col items-center justify-center">
                <span>{date.date()}</span>
                {isToday ? <span className="mt-0.5 text-[9px] uppercase tracking-wide">Hoy</span> : null}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-slate-500 md:text-xs">
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-brand-rose" />
          Fecha seleccionada
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded-full border border-rose-200 bg-white" />
          Disponible para reserva
        </span>
      </div>
    </div>
  );
}

function CalendarNavButton({ children, disabled, onClick, label, testId }) {
  return (
    <button
      type="button"
      aria-label={label}
      data-testid={testId}
      disabled={disabled}
      onClick={onClick}
      className={clsx(
        "inline-flex h-9 w-9 items-center justify-center rounded-full border transition md:h-10 md:w-10",
        disabled
          ? "cursor-not-allowed border-rose-100 bg-white/60 text-slate-300"
          : "border-rose-200 bg-white text-brand-ink hover:border-brand-rose hover:text-brand-wine"
      )}
    >
      {children}
    </button>
  );
}
