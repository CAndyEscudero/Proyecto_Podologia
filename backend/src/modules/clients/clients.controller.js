const clientService = require("./clients.service");

async function listClientsController(req, res) {
  const clients = await clientService.listClients(req.query.search);
  res.json(clients);
}

async function getClientController(req, res) {
  const client = await clientService.getClientById(req.params.id);
  res.json(client);
}

async function createClientController(req, res) {
  const client = await clientService.createClient(req.body);
  res.status(201).json(client);
}

async function updateClientController(req, res) {
  const client = await clientService.updateClient(req.params.id, req.body);
  res.json(client);
}

module.exports = {
  listClientsController,
  getClientController,
  createClientController,
  updateClientController,
};
