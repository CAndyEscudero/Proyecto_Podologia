import { http } from "../shared/api/http";

export async function login(credentials) {
  const { data } = await http.post("/auth/login", credentials);
  return data;
}

export async function getMe() {
  const { data } = await http.get("/auth/me");
  return data;
}

export async function getAppointments(params) {
  const { data } = await http.get("/appointments", { params });
  return data;
}

export async function createAppointment(payload) {
  const { data } = await http.post("/appointments", payload);
  return data;
}

export async function updateAppointment(id, payload) {
  const { data } = await http.patch(`/appointments/${id}`, payload);
  return data;
}

export async function deleteAppointment(id) {
  await http.delete(`/appointments/${id}`);
}

export async function getServices() {
  const { data } = await http.get("/services");
  return data;
}

export async function getAvailableSlots(serviceId, date) {
  const { data } = await http.get("/availability/slots", {
    params: { serviceId, date },
  });
  return data;
}

export async function createService(payload) {
  const { data } = await http.post("/services", payload);
  return data;
}

export async function updateService(id, payload) {
  const { data } = await http.patch(`/services/${id}`, payload);
  return data;
}

export async function deleteService(id) {
  await http.delete(`/services/${id}`);
}

export async function updateAppointmentStatus(id, status) {
  const { data } = await http.patch(`/appointments/${id}/status`, { status });
  return data;
}

export async function rescheduleAppointment(id, payload) {
  const { data } = await http.patch(`/appointments/${id}/reschedule`, payload);
  return data;
}

export async function getAvailabilityRules() {
  const { data } = await http.get("/availability/rules");
  return data;
}

export async function createAvailabilityRule(payload) {
  const { data } = await http.post("/availability/rules", payload);
  return data;
}

export async function updateAvailabilityRule(id, payload) {
  const { data } = await http.patch(`/availability/rules/${id}`, payload);
  return data;
}

export async function deleteAvailabilityRule(id) {
  await http.delete(`/availability/rules/${id}`);
}

export async function getBlockedDates() {
  const { data } = await http.get("/availability/blocked-dates");
  return data;
}

export async function createBlockedDate(payload) {
  const { data } = await http.post("/availability/blocked-dates", payload);
  return data;
}

export async function deleteBlockedDate(id) {
  await http.delete(`/availability/blocked-dates/${id}`);
}

export async function getBusinessSettings() {
  const { data } = await http.get("/business-settings");
  return data;
}

export async function updateBusinessSettings(payload) {
  const { data } = await http.patch("/business-settings", payload);
  return data;
}
