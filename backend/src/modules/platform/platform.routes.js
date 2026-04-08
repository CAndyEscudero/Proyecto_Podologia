const { Router } = require("express");
const { asyncHandler } = require("../../utils/async-handler");
const { tlsAllowDomainController } = require("./platform.controller");

const router = Router();

router.get("/tls-allow", asyncHandler(tlsAllowDomainController));

module.exports = router;
