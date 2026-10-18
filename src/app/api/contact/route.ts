import { NextResponse } from "next/server";
import { z } from "zod";
import { withApi } from "@/lib/apiWrapper";
import { getEnv } from "@/lib/config";

const contactSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(120),
  email: z.string().trim().email("Please provide a valid email address"),
  message: z.string().trim().min(20, "Message must be at least 20 characters").max(2000),
  website: z.string().trim().max(200).optional().or(z.literal("")),
  company: z.string().trim().max(120).optional().or(z.literal("")),
});

export const POST = withApi(
  async (_req, { body }) => {
    const parsed = contactSchema.safeParse(body);

    if (!parsed.success) {
      const issues = parsed.error.issues.map((issue) => issue.message).join(", ");
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: issues,
          },
        },
        { status: 400 },
      );
    }

    const payload = parsed.data;

    if (payload.website || payload.company) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "This submission looks like spam. Please try again.",
          },
        },
        { status: 400 },
      );
    }

    const env = getEnv();
    const hasEmailConfig = Boolean(env.RESEND_API_KEY && env.RESEND_FROM_EMAIL);

    if (hasEmailConfig) {
      const to = env.CONTACT_EMAIL || "teamkalki08@gmail.com";
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: env.RESEND_FROM_EMAIL,
          to: [to],
          reply_to: payload.email,
          subject: `WattWise contact request from ${payload.name}`,
          html: `
            <p><strong>Name:</strong> ${payload.name}</p>
            <p><strong>Email:</strong> ${payload.email}</p>
            <p><strong>Message:</strong></p>
            <p>${payload.message.replace(/\n/g, "<br />")}</p>
          `,
        }),
      });

      if (!response.ok) {
        return NextResponse.json(
          {
            error: {
              code: "EMAIL_SEND_FAILED",
              message: "Your message was validated but email delivery is unavailable right now.",
            },
          },
          { status: 503 },
        );
      }
    }

    return NextResponse.json({
      data: {
        success: true,
        mode: hasEmailConfig ? "email" : "demo",
        message: "Thanks for reaching out. We will get back to you shortly.",
      },
    });
  },
  {
    bodySchema: contactSchema,
  },
);
