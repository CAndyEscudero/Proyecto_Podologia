const { Router } = require("express");
const authRoutes = require("../modules/auth/auth.routes");
const userRoutes = require("../modules/users/users.routes");
const clientRoutes = require("../modules/clients/clients.routes");
const serviceRoutes = require("../modules/services/services.routes");
const appointmentRoutes = require("../modules/appointments/appointments.routes");
const availabilityRoutes = require("../modules/availability/availability.routes");
const businessSettingsRoutes = require("../modules/business-settings/business-settings.routes");
const paymentRoutes = require("../modules/payments/payments.routes");
const tenantDomainsRoutes = require("../modules/tenant-domains/tenant-domains.routes");
const observabilityRoutes = require("../modules/observability/observability.routes");

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/clients", clientRoutes);
router.use("/services", serviceRoutes);
router.use("/appointments", appointmentRoutes);
router.use("/payments", paymentRoutes);
router.use("/observability", observabilityRoutes);
router.use("/availability", availabilityRoutes);
router.use("/business-settings", businessSettingsRoutes);
router.use("/tenant-domains", tenantDomainsRoutes);

module.exports = router;
