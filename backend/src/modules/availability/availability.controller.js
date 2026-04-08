const availabilityService = require("./availability.service");

async function getAvailableSlotsController(req, res) {
  const data = await availabilityService.getAvailableSlots(req.tenant.id, req.query.serviceId, req.query.date);
  res.json(data);
}

async function listRulesController(req, res) {
  const rules = await availabilityService.listRules(req.tenant.id);
  res.json(rules);
}

async function createRuleController(req, res) {
  const rule = await availabilityService.createRule(req.tenant.id, req.body);
  res.status(201).json(rule);
}

async function updateRuleController(req, res) {
  const rule = await availabilityService.updateRule(req.tenant.id, req.params.id, req.body);
  res.json(rule);
}

async function deleteRuleController(req, res) {
  await availabilityService.deleteRule(req.tenant.id, req.params.id);
  res.status(204).send();
}

async function listBlockedDatesController(req, res) {
  const blockedDates = await availabilityService.listBlockedDates(req.tenant.id);
  res.json(blockedDates);
}

async function createBlockedDateController(req, res) {
  const blockedDate = await availabilityService.createBlockedDate(req.tenant.id, req.body);
  res.status(201).json(blockedDate);
}

async function deleteBlockedDateController(req, res) {
  await availabilityService.deleteBlockedDate(req.tenant.id, req.params.id);
  res.status(204).send();
}

module.exports = {
  createBlockedDateController,
  createRuleController,
  deleteBlockedDateController,
  deleteRuleController,
  getAvailableSlotsController,
  listBlockedDatesController,
  listRulesController,
  updateRuleController,
};
