const userService = require("./users.service");

async function listUsersController(req, res) {
  const users = await userService.listUsers(req.tenant.id);
  res.json(users);
}

async function createUserController(req, res) {
  const user = await userService.createUser(req.tenant.id, req.body);
  res.status(201).json(user);
}

module.exports = { listUsersController, createUserController };
