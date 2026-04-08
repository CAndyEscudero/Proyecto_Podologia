const appointmentService = require("./appointments.service");

async function createAppointmentController(req, res) {
  const appointment = await appointmentService.createAppointment(req.tenant.id, req.body);
  res.status(201).json(appointment);
}

async function createPaymentReservationController(req, res) {
  const appointment = await appointmentService.createPaymentReservation(req.tenant.id, req.body);
  res.status(201).json(appointment);
}

async function listAppointmentsController(req, res) {
  const appointments = await appointmentService.listAppointments(req.tenant.id, req.query);
  res.json(appointments);
}

async function getAppointmentController(req, res) {
  const appointment = await appointmentService.getAppointmentById(req.tenant.id, req.params.id);
  res.json(appointment);
}

async function updateAppointmentController(req, res) {
  const appointment = await appointmentService.updateAppointment(req.tenant.id, req.params.id, req.body);
  res.json(appointment);
}

async function updateAppointmentStatusController(req, res) {
  const appointment = await appointmentService.updateAppointmentStatus(
    req.tenant.id,
    req.params.id,
    req.body.status
  );
  res.json(appointment);
}

async function rescheduleAppointmentController(req, res) {
  const appointment = await appointmentService.rescheduleAppointment(
    req.tenant.id,
    req.params.id,
    req.body.date,
    req.body.startTime
  );
  res.json(appointment);
}

async function deleteAppointmentController(req, res) {
  await appointmentService.deleteAppointment(req.tenant.id, req.params.id);
  res.status(204).send();
}

module.exports = {
  createAppointmentController,
  createPaymentReservationController,
  deleteAppointmentController,
  getAppointmentController,
  listAppointmentsController,
  rescheduleAppointmentController,
  updateAppointmentController,
  updateAppointmentStatusController,
};
