const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const { env } = require("./config/env");
const routes = require("./routes");
const { notFound } = require("./middleware/not-found");
const { errorHandler } = require("./middleware/error-handler");
const { sanitizeInput } = require("./middleware/sanitize-input");

const app = express();
app.disable("x-powered-by");
const allowedOrigins = new Set([
  env.frontendUrl,
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5174",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
]);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin not allowed by CORS: ${origin}`));
    },
    credentials: true,
  })
);
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json({ limit: "20kb" }));
app.use(express.urlencoded({ extended: true, limit: "20kb" }));
app.use(sanitizeInput);

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api", routes);
app.use(notFound);
app.use(errorHandler);

module.exports = { app };
