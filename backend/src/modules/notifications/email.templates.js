const dayjs = require("dayjs");
const { normalizeDate } = require("../../utils/time");

const currencyFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

function formatCurrency(amount) {
  if (!Number.isInteger(amount)) {
    return "A confirmar";
  }

  return currencyFormatter.format(amount);
}

function formatDate(value) {
  return dayjs(normalizeDate(value)).format("DD/MM/YYYY");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildTenantEmailLayout({ tenantName, preview, title, intro, sections, cta, footerLines }) {
  const safeTitle = escapeHtml(title);
  const safeIntro = escapeHtml(intro);
  const safeTenantName = escapeHtml(tenantName);
  const sectionsHtml = sections
    .map(
      (section) => `
        <tr>
          <td style="padding: 0 0 18px;">
            <div style="border: 1px solid #f0d8de; border-radius: 18px; padding: 18px; background: #fff9fb;">
              <div style="font-size: 12px; letter-spacing: 0.18em; text-transform: uppercase; color: #9e6b78; font-weight: 700; margin-bottom: 10px;">
                ${escapeHtml(section.label)}
              </div>
              <div style="font-size: 15px; line-height: 1.6; color: #334155;">
                ${section.rows
                  .map(
                    (row) => `
                      <div style="margin-bottom: 8px;">
                        <strong style="color: #1f2937;">${escapeHtml(row.label)}:</strong>
                        <span>${escapeHtml(row.value)}</span>
                      </div>
                    `
                  )
                  .join("")}
              </div>
            </div>
          </td>
        </tr>
      `
    )
    .join("");

  const ctaHtml = cta
    ? `
      <tr>
        <td style="padding: 2px 0 22px; text-align: center;">
          <a href="${escapeHtml(cta.href)}" style="display: inline-block; padding: 14px 24px; border-radius: 999px; background: #8b4b5d; color: #ffffff; text-decoration: none; font-weight: 700;">
            ${escapeHtml(cta.label)}
          </a>
        </td>
      </tr>
    `
    : "";

  const footerHtml = footerLines
    .map((line) => `<div style="margin-top: 6px;">${escapeHtml(line)}</div>`)
    .join("");

  const html = `
    <!doctype html>
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${safeTitle}</title>
      </head>
      <body style="margin: 0; padding: 24px 12px; background: #f8f1f4; font-family: Arial, sans-serif; color: #1f2937;">
        <div style="max-width: 640px; margin: 0 auto;">
          <table role="presentation" width="100%" cellSpacing="0" cellPadding="0" style="background: #ffffff; border-radius: 28px; overflow: hidden; border: 1px solid #f0d8de;">
            <tr>
              <td style="padding: 28px 28px 20px; background: linear-gradient(135deg, #fff7fa 0%, #f9eef2 100%);">
                <div style="font-size: 12px; letter-spacing: 0.22em; text-transform: uppercase; color: #9e6b78; font-weight: 700;">
                  ${escapeHtml(preview)}
                </div>
                <h1 style="margin: 14px 0 10px; font-size: 28px; line-height: 1.15; color: #2b1c22;">
                  ${safeTitle}
                </h1>
                <p style="margin: 0; font-size: 15px; line-height: 1.7; color: #475569;">
                  ${safeIntro}
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding: 24px 28px 8px;">
                ${sectionsHtml}
                ${ctaHtml}
              </td>
            </tr>
            <tr>
              <td style="padding: 0 28px 28px; font-size: 13px; line-height: 1.7; color: #64748b;">
                <div style="border-top: 1px solid #f1e3e7; padding-top: 16px;">
                  <div style="font-weight: 700; color: #8b4b5d;">${safeTenantName}</div>
                  ${footerHtml}
                </div>
              </td>
            </tr>
          </table>
        </div>
      </body>
    </html>
  `;

  return html.trim();
}

function buildFooterLines(context) {
  return [
    context.contactEmail ? `Email de contacto: ${context.contactEmail}` : null,
    context.phone ? `Telefono: ${context.phone}` : null,
    context.address ? `Direccion: ${context.address}` : null,
    `Sitio de reservas: ${context.bookingUrl}`,
  ].filter(Boolean);
}

function buildPendingPaymentPatientEmail(context) {
  const title = "Tu reserva quedo creada y esta pendiente de pago";
  const intro = `Reservamos tu horario en ${context.tenantName}. Para confirmar el turno, completa el pago de la sena desde el link seguro que te dejamos abajo.`;
  const sections = [
    {
      label: "Resumen de la reserva",
      rows: [
        { label: "Codigo", value: `#${context.appointment.id}` },
        { label: "Servicio", value: context.service.name },
        { label: "Fecha", value: formatDate(context.appointment.date) },
        { label: "Horario", value: context.appointment.startTime },
      ],
    },
    {
      label: "Pago",
      rows: [
        { label: "Total", value: formatCurrency(context.appointment.priceCents) },
        { label: "Sena", value: formatCurrency(context.appointment.depositCents) },
        {
          label: "Vencimiento",
          value: context.appointment.paymentExpiresAt
            ? dayjs(context.appointment.paymentExpiresAt).format("DD/MM/YYYY HH:mm")
            : "Sin vencimiento informado",
        },
      ],
    },
  ];

  const text = [
    title,
    intro,
    `Codigo: #${context.appointment.id}`,
    `Servicio: ${context.service.name}`,
    `Fecha: ${formatDate(context.appointment.date)}`,
    `Horario: ${context.appointment.startTime}`,
    `Total: ${formatCurrency(context.appointment.priceCents)}`,
    `Sena: ${formatCurrency(context.appointment.depositCents)}`,
    context.checkoutUrl ? `Pagar ahora: ${context.checkoutUrl}` : null,
    ...buildFooterLines(context),
  ]
    .filter(Boolean)
    .join("\n");

  return {
    subject: `Reserva pendiente de pago en ${context.tenantName}`,
    html: buildTenantEmailLayout({
      tenantName: context.tenantName,
      preview: "Reserva pendiente de pago",
      title,
      intro,
      sections,
      cta: context.checkoutUrl
        ? {
            href: context.checkoutUrl,
            label: "Pagar sena ahora",
          }
        : null,
      footerLines: buildFooterLines(context),
    }),
    text,
  };
}

function buildApprovedPaymentPatientEmail(context) {
  const title = "Tu pago fue aprobado y el turno ya esta confirmado";
  const intro = `Recibimos correctamente la sena de tu reserva en ${context.tenantName}. Guardamos abajo todos los datos para que los tengas a mano.`;
  const sections = [
    {
      label: "Turno confirmado",
      rows: [
        { label: "Codigo", value: `#${context.appointment.id}` },
        { label: "Servicio", value: context.service.name },
        { label: "Fecha", value: formatDate(context.appointment.date) },
        { label: "Horario", value: context.appointment.startTime },
      ],
    },
    {
      label: "Pago aprobado",
      rows: [
        { label: "Sena abonada", value: formatCurrency(context.appointment.depositCents) },
        { label: "Referencia", value: context.appointment.paymentReference || "Sin referencia" },
        { label: "Estado", value: "Aprobado" },
      ],
    },
  ];

  const text = [
    title,
    intro,
    `Codigo: #${context.appointment.id}`,
    `Servicio: ${context.service.name}`,
    `Fecha: ${formatDate(context.appointment.date)}`,
    `Horario: ${context.appointment.startTime}`,
    `Sena abonada: ${formatCurrency(context.appointment.depositCents)}`,
    `Referencia: ${context.appointment.paymentReference || "Sin referencia"}`,
    ...buildFooterLines(context),
  ]
    .filter(Boolean)
    .join("\n");

  return {
    subject: `Turno confirmado en ${context.tenantName}`,
    html: buildTenantEmailLayout({
      tenantName: context.tenantName,
      preview: "Turno confirmado",
      title,
      intro,
      sections,
      footerLines: buildFooterLines(context),
    }),
    text,
  };
}

function buildRejectedPaymentPatientEmail(context) {
  const title = "No pudimos confirmar el pago de tu reserva";
  const intro = `La operacion asociada a tu turno en ${context.tenantName} no se aprobo. Si queres, podes volver a reservar o responder este email para pedir ayuda.`;
  const sections = [
    {
      label: "Reserva afectada",
      rows: [
        { label: "Codigo", value: `#${context.appointment.id}` },
        { label: "Servicio", value: context.service.name },
        { label: "Fecha", value: formatDate(context.appointment.date) },
        { label: "Horario", value: context.appointment.startTime },
      ],
    },
    {
      label: "Estado del pago",
      rows: [
        { label: "Estado", value: "No aprobado" },
        { label: "Referencia", value: context.appointment.paymentReference || "Sin referencia" },
      ],
    },
  ];

  const text = [
    title,
    intro,
    `Codigo: #${context.appointment.id}`,
    `Servicio: ${context.service.name}`,
    `Fecha: ${formatDate(context.appointment.date)}`,
    `Horario: ${context.appointment.startTime}`,
    `Referencia: ${context.appointment.paymentReference || "Sin referencia"}`,
    ...buildFooterLines(context),
  ]
    .filter(Boolean)
    .join("\n");

  return {
    subject: `Pago no aprobado en ${context.tenantName}`,
    html: buildTenantEmailLayout({
      tenantName: context.tenantName,
      preview: "Pago no aprobado",
      title,
      intro,
      sections,
      footerLines: buildFooterLines(context),
    }),
    text,
  };
}

function buildBusinessApprovedReservationEmail(context) {
  const title = "Nueva reserva confirmada con pago aprobado";
  const intro = `Se confirmo una nueva reserva paga en ${context.tenantName}. Te dejamos el detalle para que la operes desde la agenda sin perder contexto.`;
  const sections = [
    {
      label: "Paciente",
      rows: [
        {
          label: "Nombre",
          value: `${context.client.firstName} ${context.client.lastName}`.trim(),
        },
        { label: "Telefono", value: context.client.phone || "Sin telefono" },
        { label: "Email", value: context.client.email || "Sin email" },
      ],
    },
    {
      label: "Turno",
      rows: [
        { label: "Codigo", value: `#${context.appointment.id}` },
        { label: "Servicio", value: context.service.name },
        { label: "Fecha", value: formatDate(context.appointment.date) },
        { label: "Horario", value: context.appointment.startTime },
        { label: "Sena aprobada", value: formatCurrency(context.appointment.depositCents) },
      ],
    },
  ];

  const text = [
    title,
    intro,
    `Paciente: ${context.client.firstName} ${context.client.lastName}`.trim(),
    `Telefono: ${context.client.phone || "Sin telefono"}`,
    `Email: ${context.client.email || "Sin email"}`,
    `Codigo: #${context.appointment.id}`,
    `Servicio: ${context.service.name}`,
    `Fecha: ${formatDate(context.appointment.date)}`,
    `Horario: ${context.appointment.startTime}`,
    `Sena aprobada: ${formatCurrency(context.appointment.depositCents)}`,
    ...buildFooterLines(context),
  ]
    .filter(Boolean)
    .join("\n");

  return {
    subject: `Nueva reserva confirmada en ${context.tenantName}`,
    html: buildTenantEmailLayout({
      tenantName: context.tenantName,
      preview: "Nueva reserva confirmada",
      title,
      intro,
      sections,
      footerLines: buildFooterLines(context),
    }),
    text,
  };
}

function buildAppointmentReminderPatientEmail(context) {
  const title = "Recordatorio de tu turno";
  const intro = `Te recordamos que tenes un turno confirmado en ${context.tenantName}. Te dejamos el detalle para que lo tengas a mano.`;
  const sections = [
    {
      label: "Turno",
      rows: [
        { label: "Codigo", value: `#${context.appointment.id}` },
        { label: "Servicio", value: context.service.name },
        { label: "Fecha", value: formatDate(context.appointment.date) },
        { label: "Horario", value: context.appointment.startTime },
      ],
    },
  ];

  const text = [
    title,
    intro,
    `Codigo: #${context.appointment.id}`,
    `Servicio: ${context.service.name}`,
    `Fecha: ${formatDate(context.appointment.date)}`,
    `Horario: ${context.appointment.startTime}`,
    ...buildFooterLines(context),
  ]
    .filter(Boolean)
    .join("\n");

  return {
    subject: `Recordatorio de turno en ${context.tenantName}`,
    html: buildTenantEmailLayout({
      tenantName: context.tenantName,
      preview: "Recordatorio de turno",
      title,
      intro,
      sections,
      footerLines: buildFooterLines(context),
    }),
    text,
  };
}

function buildRescheduledAppointmentPatientEmail(context) {
  const previousLabel = context.previousSchedule
    ? `${formatDate(context.previousSchedule.date)} a las ${context.previousSchedule.startTime}`
    : "Horario anterior no disponible";
  const title = "Tu turno fue reprogramado";
  const intro = `Actualizamos tu reserva en ${context.tenantName}. Abajo vas a ver el horario nuevo y el anterior para que puedas chequear el cambio.`;
  const sections = [
    {
      label: "Nuevo turno",
      rows: [
        { label: "Codigo", value: `#${context.appointment.id}` },
        { label: "Servicio", value: context.service.name },
        { label: "Fecha", value: formatDate(context.appointment.date) },
        { label: "Horario", value: context.appointment.startTime },
      ],
    },
    {
      label: "Horario anterior",
      rows: [{ label: "Antes estaba previsto para", value: previousLabel }],
    },
  ];

  const text = [
    title,
    intro,
    `Codigo: #${context.appointment.id}`,
    `Servicio: ${context.service.name}`,
    `Nuevo horario: ${formatDate(context.appointment.date)} ${context.appointment.startTime}`,
    `Horario anterior: ${previousLabel}`,
    ...buildFooterLines(context),
  ]
    .filter(Boolean)
    .join("\n");

  return {
    subject: `Turno reprogramado en ${context.tenantName}`,
    html: buildTenantEmailLayout({
      tenantName: context.tenantName,
      preview: "Turno reprogramado",
      title,
      intro,
      sections,
      footerLines: buildFooterLines(context),
    }),
    text,
  };
}

function buildCanceledAppointmentPatientEmail(context) {
  const title = "Tu turno fue cancelado";
  const intro = `Te avisamos que el turno que tenias reservado en ${context.tenantName} fue cancelado. Si necesitas recoordinar, podes responder este email o volver a reservar desde el sitio.`;
  const sections = [
    {
      label: "Turno cancelado",
      rows: [
        { label: "Codigo", value: `#${context.appointment.id}` },
        { label: "Servicio", value: context.service.name },
        { label: "Fecha", value: formatDate(context.appointment.date) },
        { label: "Horario", value: context.appointment.startTime },
      ],
    },
  ];

  const text = [
    title,
    intro,
    `Codigo: #${context.appointment.id}`,
    `Servicio: ${context.service.name}`,
    `Fecha: ${formatDate(context.appointment.date)}`,
    `Horario: ${context.appointment.startTime}`,
    ...buildFooterLines(context),
  ]
    .filter(Boolean)
    .join("\n");

  return {
    subject: `Turno cancelado en ${context.tenantName}`,
    html: buildTenantEmailLayout({
      tenantName: context.tenantName,
      preview: "Turno cancelado",
      title,
      intro,
      sections,
      cta: {
        href: context.bookingUrl,
        label: "Volver a reservar",
      },
      footerLines: buildFooterLines(context),
    }),
    text,
  };
}

module.exports = {
  buildAppointmentReminderPatientEmail,
  buildApprovedPaymentPatientEmail,
  buildBusinessApprovedReservationEmail,
  buildCanceledAppointmentPatientEmail,
  buildPendingPaymentPatientEmail,
  buildRejectedPaymentPatientEmail,
  buildRescheduledAppointmentPatientEmail,
};
