import { useEffect, useState } from "react";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import type { ApiErrorResponse } from "../../../shared/types/api";
import type { AvailabilitySlot, Service } from "../../../shared/types/domain";
import type { NextAvailableOption } from "../types/booking.types";
import { getAvailableSlots, getPublicServices } from "../api/booking.api";

interface UseBookingAvailabilityParams {
  serviceId: string;
  date: string;
  maxBookingDate: string;
}

interface UseBookingAvailabilityResult {
  services: Service[];
  servicesError: string;
  isLoadingServices: boolean;
  slots: AvailabilitySlot[];
  isLoadingSlots: boolean;
  availabilityError: string;
  nextAvailableOption: NextAvailableOption | null;
  isSearchingNextDate: boolean;
  clearSuggestions: () => void;
}

function getApiMessage(error: unknown, fallbackMessage: string): string {
  const maybeError = error as { response?: { data?: ApiErrorResponse } };
  return maybeError?.response?.data?.message || fallbackMessage;
}

export function useBookingAvailability({
  serviceId,
  date,
  maxBookingDate,
}: UseBookingAvailabilityParams): UseBookingAvailabilityResult {
  const [services, setServices] = useState<Service[]>([]);
  const [servicesError, setServicesError] = useState("");
  const [isLoadingServices, setIsLoadingServices] = useState(true);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [availabilityError, setAvailabilityError] = useState("");
  const [nextAvailableOption, setNextAvailableOption] = useState<NextAvailableOption | null>(null);
  const [isSearchingNextDate, setIsSearchingNextDate] = useState(false);

  useEffect(() => {
    async function fetchServices() {
      try {
        setIsLoadingServices(true);
        setServicesError("");
        const data = await getPublicServices();
        setServices(data);
      } catch (error) {
        setServices([]);
        setServicesError("No se pudieron cargar los servicios");
        toast.error(getApiMessage(error, "No se pudieron cargar los servicios"));
      } finally {
        setIsLoadingServices(false);
      }
    }

    void fetchServices();
  }, []);

  useEffect(() => {
    async function fetchSlots() {
      if (!serviceId || !date) {
        setSlots([]);
        setAvailabilityError("");
        return;
      }

      try {
        setIsLoadingSlots(true);
        setAvailabilityError("");
        const data = await getAvailableSlots(serviceId, date);
        setSlots(data.slots || []);

        if (!data.slots?.length) {
          setAvailabilityError("No hay horarios disponibles para esa fecha");
        }
      } catch (error) {
        setSlots([]);
        setAvailabilityError(getApiMessage(error, "No se pudo cargar la disponibilidad"));
      } finally {
        setIsLoadingSlots(false);
      }
    }

    void fetchSlots();
  }, [serviceId, date]);

  useEffect(() => {
    let cancelled = false;

    async function findNextAvailableDate() {
      if (!serviceId || !date || isLoadingSlots || slots.length > 0) {
        setNextAvailableOption(null);
        setIsSearchingNextDate(false);
        return;
      }

      setIsSearchingNextDate(true);

      try {
        let cursor = dayjs(date).add(1, "day");
        const maxDate = dayjs(maxBookingDate);

        while (cursor.valueOf() <= maxDate.valueOf()) {
          const candidateDate = cursor.format("YYYY-MM-DD");
          const data = await getAvailableSlots(serviceId, candidateDate);

          if (data.slots?.length) {
            if (!cancelled) {
              setNextAvailableOption({
                date: candidateDate,
                firstSlot: data.slots[0].startTime,
                slotsCount: data.slots.length,
              });
            }
            return;
          }

          cursor = cursor.add(1, "day");
        }

        if (!cancelled) {
          setNextAvailableOption(null);
        }
      } catch {
        if (!cancelled) {
          setNextAvailableOption(null);
        }
      } finally {
        if (!cancelled) {
          setIsSearchingNextDate(false);
        }
      }
    }

    void findNextAvailableDate();

    return () => {
      cancelled = true;
    };
  }, [date, isLoadingSlots, maxBookingDate, serviceId, slots.length]);

  return {
    services,
    servicesError,
    isLoadingServices,
    slots,
    isLoadingSlots,
    availabilityError,
    nextAvailableOption,
    isSearchingNextDate,
    clearSuggestions: () => setNextAvailableOption(null),
  };
}
