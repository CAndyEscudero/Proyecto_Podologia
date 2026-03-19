const { Router } = require("express");
const {
  createAppointmentController,
  deleteAppointmentController,
  getAppointmentController,
  listAppointmentsController,
  rescheduleAppointmentController,
  updateAppointmentController,
  updateAppointmentStatusController,
} = require("./appointments.controller");
const { asyncHandler } = require("../../utils/async-handler");
const { requireAuth } = require("../../middleware/auth");
const { requireRoles } = require("../../middleware/require-roles");
const { validateRequest } = require("../../middleware/validate-request");
const {
  appointmentCreateValidation,
  appointmentRescheduleValidation,
  appointmentStatusValidation,
  appointmentUpdateValidation,
} = require("./appointments.validation");

const router = Router();

router.get("/", requireAuth, asyncHandler(listAppointmentsController));
router.get("/:id", requireAuth, appointmentUpdateValidation, validateRequest, asyncHandler(getAppointmentController));
router.post("/", appointmentCreateValidation, validateRequest, asyncHandler(createAppointmentController));
router.patch("/:id", requireAuth, requireRoles("OWNER", "ADMIN", "STAFF"), appointmentUpdateValidation, validateRequest, asyncHandler(updateAppointmentController));
router.patch("/:id/status", requireAuth, requireRoles("OWNER", "ADMIN", "STAFF"), appointmentStatusValidation, validateRequest, asyncHandler(updateAppointmentStatusController));
router.patch("/:id/reschedule", requireAuth, requireRoles("OWNER", "ADMIN", "STAFF"), appointmentRescheduleValidation, validateRequest, asyncHandler(rescheduleAppointmentController));
router.delete("/:id", requireAuth, requireRoles("OWNER", "ADMIN", "STAFF"), appointmentUpdateValidation, validateRequest, asyncHandler(deleteAppointmentController));

module.exports = router;
