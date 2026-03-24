function calculateDepositCents(priceCents) {
  if (!Number.isInteger(priceCents) || priceCents <= 0) {
    return null;
  }

  return Math.ceil(priceCents * 0.5);
}

function buildPendingPaymentWindow(minutes = 15) {
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + minutes);
  return expiresAt;
}

module.exports = {
  buildPendingPaymentWindow,
  calculateDepositCents,
};
