const { login } = require("./auth.service");

function serializeTenant(tenant) {
  if (!tenant) {
    return null;
  }

  return {
    id: tenant.id,
    slug: tenant.slug,
    name: tenant.name,
    businessType: tenant.businessType,
    hostname: tenant.hostname,
    domainType: tenant.domainType,
  };
}

async function loginController(req, res) {
  const result = await login({
    ...req.body,
    tenantId: req.tenant.id,
  });

  res.json({
    ...result,
    tenant: serializeTenant(req.tenant),
  });
}

async function meController(req, res) {
  res.json({
    user: {
      id: req.user.id,
      tenantId: req.user.tenantId,
      email: req.user.email,
      fullName: req.user.fullName,
      role: req.user.role,
    },
    tenant: serializeTenant(req.tenant),
  });
}

module.exports = { loginController, meController };
