import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

type WelcomeEmailInput = {
  fullName: string;
  email: string;
  role: "admin" | "student";
};

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter?: Transporter;

  constructor(private readonly config: ConfigService) {}

  async sendWelcomeEmail(input: WelcomeEmailInput) {
    const transporter = this.getTransporter();
    if (!transporter) {
      this.logger.log("Welcome email skipped because SMTP is not configured.");
      return;
    }

    const appUrl = this.config.get<string>("FRONTEND_ORIGIN") ?? "https://mytlchub.com";
    const firstName = input.fullName.trim().split(/\s+/)[0] || "there";
    const roleLabel = input.role === "admin" ? "admin workspace" : "student practice room";

    await transporter.sendMail({
      from: this.mailFrom(),
      to: input.email,
      subject: "Welcome to TLCHub",
      text: [
        `Hi ${firstName},`,
        "",
        `Welcome to TLCHub. Your ${roleLabel} is ready.`,
        "",
        input.role === "admin"
          ? "You can now manage questions, review attempts, and monitor student feedback from your dashboard."
          : "You can now take quizzes, save your attempts, review AI feedback, and get guided revision support.",
        "",
        `Open TLCHub: ${appUrl}`,
        "",
        "Best,",
        "The TLCHub Team",
      ].join("\n"),
      html: this.welcomeHtml({ ...input, appUrl, firstName, roleLabel }),
    });
  }

  private getTransporter() {
    if (this.transporter) return this.transporter;

    const host = this.config.get<string>("SMTP_HOST")?.trim();
    const user = this.config.get<string>("SMTP_USER")?.trim();
    const pass = this.config.get<string>("SMTP_PASS")?.trim();
    const port = Number(this.config.get<string>("SMTP_PORT") ?? 587);

    if (!host || !user || !pass) return null;

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    });

    return this.transporter;
  }

  private mailFrom() {
    return this.config.get<string>("SMTP_FROM")?.trim() || "TLCHub <no-reply@mytlchub.com>";
  }

  private welcomeHtml({
    appUrl,
    firstName,
    role,
    roleLabel,
  }: WelcomeEmailInput & { appUrl: string; firstName: string; roleLabel: string }) {
    const body =
      role === "admin"
        ? "You can now manage questions, review attempts, and monitor student feedback from your dashboard."
        : "You can now take quizzes, save your attempts, review AI feedback, and get guided revision support.";

    return `<!doctype html>
<html>
  <body style="margin:0;background:#f7fbff;font-family:Arial,Helvetica,sans-serif;color:#10243f;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f7fbff;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #d5e2f0;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="background:#082b63;padding:28px 32px;color:#ffffff;">
                <div style="font-size:13px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#8de19a;">TLCHub</div>
                <h1 style="margin:10px 0 0;font-size:28px;line-height:1.2;">Welcome, ${this.escapeHtml(firstName)}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:30px 32px;">
                <p style="margin:0 0 16px;font-size:16px;line-height:1.7;">Your ${this.escapeHtml(roleLabel)} is ready.</p>
                <p style="margin:0 0 24px;font-size:16px;line-height:1.7;">${body}</p>
                <a href="${this.escapeHtml(appUrl)}" style="display:inline-block;background:#087c22;color:#ffffff;text-decoration:none;font-weight:700;padding:13px 18px;border-radius:8px;">Open TLCHub</a>
                <p style="margin:28px 0 0;font-size:13px;line-height:1.6;color:#5e7086;">If you did not create this account, you can ignore this email.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
  }

  private escapeHtml(value: string) {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
}
