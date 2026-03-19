import { http } from "../lib/http";

export async function getPublicServices() {
  const { data } = await http.get("/services");
  return data;
}

export async function getAvailableSlots(serviceId, date) {
  const { data } = await http.get("/availability/slots", {
    params: { serviceId, date },
  });
  return data;
}

export async function createAppointment(payload) {
  const { data } = await http.post("/appointments", payload);
  return data;
}
