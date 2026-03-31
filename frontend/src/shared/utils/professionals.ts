import type { Professional } from "../types/domain";

const PROFESSIONALS_STORAGE_KEY = "planify_professionals";

function sanitizeProfessional(value: unknown): Professional | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<Professional>;

  if (typeof candidate.id !== "number" || typeof candidate.fullName !== "string") {
    return null;
  }

  return {
    id: candidate.id,
    fullName: candidate.fullName,
    bio: typeof candidate.bio === "string" ? candidate.bio : "",
    acceptsAllServices: Boolean(candidate.acceptsAllServices),
    serviceIds: Array.isArray(candidate.serviceIds)
      ? candidate.serviceIds.filter((serviceId): serviceId is number => typeof serviceId === "number")
      : [],
    isActive: candidate.isActive !== false,
    createdAt: typeof candidate.createdAt === "string" ? candidate.createdAt : undefined,
    updatedAt: typeof candidate.updatedAt === "string" ? candidate.updatedAt : undefined,
  };
}

export function sortProfessionals(professionals: Professional[]): Professional[] {
  return [...professionals].sort((left, right) => {
    if (left.isActive !== right.isActive) {
      return left.isActive ? -1 : 1;
    }

    return left.fullName.localeCompare(right.fullName, "es");
  });
}

export function getStoredProfessionals(): Professional[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(PROFESSIONALS_STORAGE_KEY);

    if (!rawValue) {
      return [];
    }

    const parsed = JSON.parse(rawValue);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return sortProfessionals(
      parsed
        .map((item) => sanitizeProfessional(item))
        .filter((professional): professional is Professional => professional !== null)
    );
  } catch {
    return [];
  }
}

export function saveStoredProfessionals(professionals: Professional[]): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    PROFESSIONALS_STORAGE_KEY,
    JSON.stringify(sortProfessionals(professionals))
  );
}

export function getNextProfessionalId(professionals: Professional[]): number {
  return professionals.reduce((maxId, professional) => Math.max(maxId, professional.id), 0) + 1;
}
