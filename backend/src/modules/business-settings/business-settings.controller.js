const settingsService = require("./business-settings.service");

async function getPublicBusinessSettingsController(req, res) {
  const settings = await settingsService.getPublicBusinessSettings(req.tenant);
  res.json(settings);
}

async function getBusinessSettingsController(req, res) {
  const settings = await settingsService.getBusinessSettings(req.tenant);
  res.json(settings);
}

async function updateBusinessSettingsController(req, res) {
  const settings = await settingsService.updateBusinessSettings(req.tenant, req.body);
  res.json(settings);
}

module.exports = {
  getBusinessSettingsController,
  getPublicBusinessSettingsController,
  updateBusinessSettingsController,
};
