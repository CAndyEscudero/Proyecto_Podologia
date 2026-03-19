const userService = require("./users.service");

async function listUsersController(req, res) {
  const users = await userService.listUsers();
  res.json(users);
}

async function createUserController(req, res) {
  const user = await userService.createUser(req.body);
  res.status(201).json(user);
}

module.exports = { listUsersController, createUserController };
