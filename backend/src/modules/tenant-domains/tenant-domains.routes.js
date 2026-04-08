const { Router } = require("express");
const { asyncHandler } = require("../../utils/async-handler");
const { requireAuth } = require("../../middleware/auth");
const { requireRoles } = require("../../middleware/require-roles");
const { validateRequest } = require("../../middleware/validate-request");
const {
  getTenantDomainsOverviewController,
  setPrimaryTenantDomainController,
  upsertTenantCustomDomainController,
  verifyTenantDomainController,
} = require("./tenant-domains.controller");
const {
  tenantDomainIdValidation,
  upsertTenantCustomDomainValidation,
} = require("./tenant-domains.validation");

const router = Router();

router.use(requireAuth, requireRoles("OWNER", "ADMIN"));

router.get("/", asyncHandler(getTenantDomainsOverviewController));
router.put(
  "/custom",
  upsertTenantCustomDomainValidation,
  validateRequest,
  asyncHandler(upsertTenantCustomDomainController)
);
router.post(
  "/:id/verify",
  tenantDomainIdValidation,
  validateRequest,
  asyncHandler(verifyTenantDomainController)
);
router.patch(
  "/:id/primary",
  tenantDomainIdValidation,
  validateRequest,
  asyncHandler(setPrimaryTenantDomainController)
);

module.exports = router;
