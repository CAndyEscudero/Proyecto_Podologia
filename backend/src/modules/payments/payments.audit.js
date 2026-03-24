function logPaymentAudit(event, details = {}) {
  const payload = {
    scope: "payments",
    event,
    timestamp: new Date().toISOString(),
    ...details,
  };

  console.info(JSON.stringify(payload));
}

module.exports = {
  logPaymentAudit,
};
