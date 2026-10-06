import nodemailer from "nodemailer";

const getTransporter = () => nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendWorkshopConfirmation = async ({ to, name, workshopTitle, scheduledAt, zoomLink, orderId, price }) => {
  const dateStr = scheduledAt
    ? new Date(scheduledAt).toLocaleString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" }) + " IST"
    : "Date to be announced";

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0B0F10;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 16px;">
    <!-- Logo -->
    <div style="text-align:center;margin-bottom:28px;">
      <span style="color:#C7E36B;font-size:24px;font-weight:900;letter-spacing:2px;">AIFA</span>
      <span style="color:#ffffff;font-size:24px;font-weight:900;"> Film Academy</span>
    </div>

    <!-- Success banner -->
    <div style="background:#111315;border:1px solid #C7E36B33;border-radius:16px;padding:28px;margin-bottom:20px;text-align:center;">
      <div style="width:56px;height:56px;background:#C7E36B;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">
        <span style="font-size:26px;">✓</span>
      </div>
      <h1 style="color:#ffffff;font-size:22px;font-weight:900;margin:0 0 8px;">Seat Confirmed!</h1>
      <p style="color:#9ca3af;font-size:14px;margin:0;">Hi <strong style="color:#fff;">${name}</strong>, your registration for <strong style="color:#C7E36B;">${workshopTitle}</strong> is confirmed.</p>
    </div>

    <!-- Details card -->
    <div style="background:#111315;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:24px;margin-bottom:20px;">
      <p style="color:#6b7280;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;margin:0 0 16px;">Workshop Details</p>

      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="color:#9ca3af;font-size:13px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);">Workshop</td>
          <td style="color:#ffffff;font-size:13px;font-weight:600;text-align:right;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);">${workshopTitle}</td>
        </tr>
        <tr>
          <td style="color:#9ca3af;font-size:13px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);">Date & Time</td>
          <td style="color:#ffffff;font-size:13px;font-weight:600;text-align:right;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);">${dateStr}</td>
        </tr>
        <tr>
          <td style="color:#9ca3af;font-size:13px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);">Order ID</td>
          <td style="color:#C7E36B;font-size:13px;font-weight:600;text-align:right;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);">${orderId || "—"}</td>
        </tr>
        <tr>
          <td style="color:#9ca3af;font-size:13px;padding:8px 0;">Amount Paid</td>
          <td style="color:#4ade80;font-size:13px;font-weight:700;text-align:right;padding:8px 0;">${price || "Confirmed"}</td>
        </tr>
      </table>
    </div>

    ${zoomLink ? `
    <!-- Zoom link -->
    <div style="background:#111315;border:1px solid #C7E36B44;border-radius:16px;padding:20px;margin-bottom:20px;text-align:center;">
      <p style="color:#9ca3af;font-size:12px;margin:0 0 12px;">Your Zoom meeting link for the workshop:</p>
      <a href="${zoomLink}" style="display:inline-block;background:#C7E36B;color:#0B0F10;font-weight:900;font-size:14px;padding:12px 28px;border-radius:10px;text-decoration:none;">JOIN WORKSHOP →</a>
      <p style="color:#6b7280;font-size:11px;margin:12px 0 0;">Or copy this link: <span style="color:#C7E36B;">${zoomLink}</span></p>
    </div>
    ` : `
    <div style="background:#111315;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:20px;margin-bottom:20px;text-align:center;">
      <p style="color:#9ca3af;font-size:13px;margin:0;">The Zoom meeting link will be shared with you before the session begins.</p>
    </div>
    `}

    <!-- Footer -->
    <p style="color:#4b5563;font-size:12px;text-align:center;margin:0;">Questions? Reach us at <a href="mailto:info@aifa.co.in" style="color:#C7E36B;">info@aifa.co.in</a></p>
  </div>
</body>
</html>`;

  await getTransporter().sendMail({
    from: process.env.SMTP_FROM || "AIFA Film Academy <info@aifa.co.in>",
    to,
    subject: `✅ Seat Confirmed – ${workshopTitle}`,
    html,
  });
};

export const sendBookingConfirmation = async ({ name, email, phone, preferredDate, preferredTime, topic, meetLink }) => {
  const userHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0B0F10;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 16px;">
    <div style="text-align:center;margin-bottom:28px;">
      <span style="color:#C7E36B;font-size:24px;font-weight:900;letter-spacing:2px;">AIFA</span>
      <span style="color:#ffffff;font-size:24px;font-weight:900;"> Film Academy</span>
    </div>
    <div style="background:#111315;border:1px solid #C7E36B33;border-radius:16px;padding:28px;margin-bottom:20px;text-align:center;">
      <div style="width:56px;height:56px;background:#C7E36B;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">
        <span style="font-size:26px;">✓</span>
      </div>
      <h1 style="color:#ffffff;font-size:22px;font-weight:900;margin:0 0 8px;">${meetLink ? "Call Confirmed!" : "Booking Request Received!"}</h1>
      <p style="color:#9ca3af;font-size:14px;margin:0;">Hi <strong style="color:#fff;">${name}</strong>, ${meetLink ? "your free 30-minute counselling call is confirmed." : "we've received your request for a free 30-minute counselling call."}</p>
    </div>
    <div style="background:#111315;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:24px;margin-bottom:20px;">
      <p style="color:#6b7280;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;margin:0 0 16px;">Your Booking Details</p>
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="color:#9ca3af;font-size:13px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);">Date</td>
          <td style="color:#ffffff;font-size:13px;font-weight:600;text-align:right;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);">${preferredDate || "—"}</td>
        </tr>
        <tr>
          <td style="color:#9ca3af;font-size:13px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);">Time</td>
          <td style="color:#ffffff;font-size:13px;font-weight:600;text-align:right;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);">${preferredTime || "—"}</td>
        </tr>
        ${topic ? `<tr>
          <td style="color:#9ca3af;font-size:13px;padding:8px 0;">Topic</td>
          <td style="color:#ffffff;font-size:13px;font-weight:600;text-align:right;padding:8px 0;">${topic}</td>
        </tr>` : ""}
      </table>
    </div>
    ${meetLink ? `
    <div style="background:#111315;border:1px solid #C7E36B44;border-radius:16px;padding:20px;margin-bottom:20px;text-align:center;">
      <p style="color:#9ca3af;font-size:12px;margin:0 0 12px;">Your Zoom meeting link:</p>
      <a href="${meetLink}" style="display:inline-block;background:#C7E36B;color:#0B0F10;font-weight:900;font-size:14px;padding:12px 28px;border-radius:10px;text-decoration:none;">JOIN MEETING →</a>
      <p style="color:#6b7280;font-size:11px;margin:12px 0 0;word-break:break-all;">${meetLink}</p>
    </div>
    ` : `
    <div style="background:#111315;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:20px;margin-bottom:20px;text-align:center;">
      <p style="color:#9ca3af;font-size:13px;margin:0;">Our team will confirm your slot and share the Zoom meeting link shortly. We typically respond within a few hours.</p>
    </div>
    `}
    <p style="color:#4b5563;font-size:12px;text-align:center;margin:0;">Questions? Reach us at <a href="mailto:info@aifa.co.in" style="color:#C7E36B;">info@aifa.co.in</a></p>
  </div>
</body>
</html>`;

  const adminHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 16px;">

    <!-- Header -->
    <div style="text-align:center;margin-bottom:24px;">
      <span style="color:#4f7df3;font-size:24px;font-weight:900;letter-spacing:2px;">AIFA</span>
      <span style="color:#111827;font-size:24px;font-weight:900;"> Film Academy</span>
    </div>

    <!-- Alert banner -->
    <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;padding:24px;margin-bottom:16px;">
      <div style="display:flex;align-items:center;gap:16px;">
        <div style="width:48px;height:48px;background:#4f7df3;border-radius:12px;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;">
          <span style="font-size:22px;">📞</span>
        </div>
        <div>
          <p style="color:#4f7df3;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;margin:0 0 4px;">New Booking</p>
          <h1 style="color:#111827;font-size:18px;font-weight:900;margin:0;">${name} requested a call</h1>
          <p style="color:#6b7280;font-size:12px;margin:4px 0 0;">${preferredDate || "—"} at ${preferredTime || "—"} · 30 min</p>
        </div>
      </div>
    </div>

    <!-- Contact details -->
    <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;padding:24px;margin-bottom:16px;">
      <p style="color:#9ca3af;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;margin:0 0 16px;">Contact Details</p>
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="color:#6b7280;font-size:13px;padding:10px 0;border-bottom:1px solid #f3f4f6;"><span style="margin-right:8px;">👤</span>Name</td>
          <td style="color:#111827;font-size:13px;font-weight:700;text-align:right;padding:10px 0;border-bottom:1px solid #f3f4f6;">${name}</td>
        </tr>
        <tr>
          <td style="color:#6b7280;font-size:13px;padding:10px 0;border-bottom:1px solid #f3f4f6;"><span style="margin-right:8px;">✉️</span>Email</td>
          <td style="text-align:right;padding:10px 0;border-bottom:1px solid #f3f4f6;">
            <a href="mailto:${email}" style="color:#4f7df3;font-size:13px;font-weight:700;text-decoration:none;">${email}</a>
          </td>
        </tr>
        <tr>
          <td style="color:#6b7280;font-size:13px;padding:10px 0;${topic ? "border-bottom:1px solid #f3f4f6;" : ""}"><span style="margin-right:8px;">📱</span>Phone</td>
          <td style="text-align:right;padding:10px 0;${topic ? "border-bottom:1px solid #f3f4f6;" : ""}">
            <a href="tel:${phone}" style="color:#4f7df3;font-size:13px;font-weight:700;text-decoration:none;">${phone || "—"}</a>
          </td>
        </tr>
        ${topic ? `<tr>
          <td style="color:#6b7280;font-size:13px;padding:10px 0;vertical-align:top;"><span style="margin-right:8px;">💬</span>Topic</td>
          <td style="color:#111827;font-size:13px;font-weight:600;text-align:right;padding:10px 0;">${topic}</td>
        </tr>` : ""}
      </table>
    </div>

    <!-- Schedule + status -->
    <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;padding:24px;margin-bottom:16px;">
      <p style="color:#9ca3af;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;margin:0 0 16px;">Scheduled For</p>
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;">
        <div>
          <p style="color:#111827;font-size:18px;font-weight:900;margin:0;">${preferredDate || "—"}</p>
          <p style="color:#6b7280;font-size:13px;margin:4px 0 0;">${preferredTime || "—"} · 30 minutes · IST</p>
        </div>
        <div style="background:${meetLink ? "#dcfce7" : "#fef9c3"};border:1px solid ${meetLink ? "#86efac" : "#fde047"};border-radius:8px;padding:6px 14px;">
          <p style="color:${meetLink ? "#166534" : "#854d0e"};font-size:12px;font-weight:700;margin:0;">${meetLink ? "✓ CONFIRMED" : "⏳ PENDING"}</p>
        </div>
      </div>
    </div>

    ${meetLink ? `
    <!-- Zoom link -->
    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:16px;padding:20px;margin-bottom:20px;text-align:center;">
      <p style="color:#3b82f6;font-size:12px;font-weight:600;margin:0 0 14px;">Zoom meeting auto-created for this session</p>
      <a href="${meetLink}" style="display:inline-block;background:#4f7df3;color:#ffffff;font-weight:900;font-size:14px;padding:12px 32px;border-radius:10px;text-decoration:none;letter-spacing:0.5px;">START MEETING →</a>
      <p style="color:#93c5fd;font-size:11px;margin:12px 0 0;word-break:break-all;">${meetLink}</p>
    </div>
    ` : `
    <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:16px;padding:20px;margin-bottom:20px;text-align:center;">
      <p style="color:#92400e;font-size:13px;margin:0;">Go to Admin Dashboard → Sales Consultation to confirm and add a Zoom link.</p>
    </div>
    `}

    <!-- Footer -->
    <p style="color:#9ca3af;font-size:12px;text-align:center;margin:0;">
      AIFA Film Academy · <a href="https://aifa.co.in/admin" style="color:#4f7df3;text-decoration:none;">Open Admin Dashboard →</a>
    </p>
  </div>
</body>
</html>`;

  const t = getTransporter();
  await Promise.all([
    t.sendMail({
      from: process.env.SMTP_FROM || "AIFA Film Academy <info@aifa.co.in>",
      to: email,
      subject: meetLink ? "✅ Your Call is Confirmed – AIFA Counselling Call" : "✅ Booking Request Received – AIFA Counselling Call",
      html: userHtml,
    }),
    t.sendMail({
      from: process.env.SMTP_FROM || "AIFA Film Academy <info@aifa.co.in>",
      to: "info@aifa.co.in",
      subject: `📞 New Consultation Request – ${name}`,
      html: adminHtml,
    }),
  ]);
};
