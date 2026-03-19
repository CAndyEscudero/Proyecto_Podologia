const { login } = require("./auth.service");

async function loginController(req, res) {
  const result = await login(req.body);
  res.json(result);
}

async function meController(req, res) {
  res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
      fullName: req.user.fullName,
      role: req.user.role,
    },
  });
}

module.exports = { loginController, meController };
