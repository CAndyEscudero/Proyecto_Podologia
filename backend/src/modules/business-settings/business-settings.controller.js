const settingsService = require("./business-settings.service");

async function getBusinessSettingsController(req, res) {
  const settings = await settingsService.getBusinessSettings();
  res.json(settings);
}

async function updateBusinessSettingsController(req, res) {
  const settings = await settingsService.updateBusinessSettings(req.body);
  res.json(settings);
}

module.exports = { getBusinessSettingsController, updateBusinessSettingsController };
