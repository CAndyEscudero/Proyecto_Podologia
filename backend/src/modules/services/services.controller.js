const serviceService = require("./services.service");

async function listServicesController(req, res) {
  const services = await serviceService.listServices();
  res.json(services);
}

async function createServiceController(req, res) {
  const service = await serviceService.createService(req.body);
  res.status(201).json(service);
}

async function updateServiceController(req, res) {
  const service = await serviceService.updateService(req.params.id, req.body);
  res.json(service);
}

async function deleteServiceController(req, res) {
  await serviceService.deleteService(req.params.id);
  res.status(204).send();
}

module.exports = {
  listServicesController,
  createServiceController,
  updateServiceController,
  deleteServiceController,
};
