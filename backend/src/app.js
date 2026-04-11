const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { env } = require("./config/env");
const routes = require("./routes");
const { notFound } = require("./middleware/not-found");
const { errorHandler } = require("./middleware/error-handler");
const { sanitizeInput } = require("./middleware/sanitize-input");
const { resolveTenant } = require("./middleware/resolve-tenant");
const { requestContext } = require("./middleware/request-context");
const { requestLogger } = require("./middleware/request-logger");
const platformRoutes = require("./modules/platform/platform.routes");
const {
  buildAllowedOrigins,
  createCorsOriginResolver,
} = require("./middleware/cors-config");

const app = express();
app.disable("x-powered-by");
const allowedOrigins = buildAllowedOrigins(env);

app.use(
  cors({
    origin: createCorsOriginResolver({
      allowedOrigins,
      nodeEnv: env.nodeEnv,
      platformApexDomain: env.platformApexDomain,
    }),
    credentials: true,
  })
);
app.use(helmet());
app.use(requestContext);
app.use(express.json({ limit: "20kb" }));
app.use(express.urlencoded({ extended: true, limit: "20kb" }));
app.use(sanitizeInput);
app.use(requestLogger);

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/internal/platform", platformRoutes);
app.use("/api", resolveTenant, routes);
app.use(notFound);
app.use(errorHandler);

module.exports = { app };
