import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface EmailRequest {
  email: string;
  code: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { email, code }: EmailRequest = await req.json();

    if (!email || !code) {
      return new Response(
        JSON.stringify({ error: "Email and code are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const emailContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; }
    .container { max-width: 600px; margin: 40px auto; background: white; padding: 40px; border-radius: 8px; }
    .header { text-align: center; margin-bottom: 30px; }
    .brand { font-size: 28px; font-weight: 700; letter-spacing: -1px; margin-bottom: 10px; }
    .message { color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 30px; }
    .code-box { background: #f0f0f0; padding: 20px; border-radius: 6px; text-align: center; margin: 30px 0; }
    .code { font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #000; font-family: 'Courier New', monospace; }
    .footer { color: #999; font-size: 12px; text-align: center; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="brand">Nervont: Limited Collections</div>
      <p style="color: #999; margin: 0; font-size: 14px;">Your Early Access Awaits</p>
    </div>
    <div class="message">
      <p>Welcome to the waitlist. Your verification code is:</p>
    </div>
    <div class="code-box">
      <div class="code">${code}</div>
    </div>
    <div class="message">
      <p>Enter this code on our website to complete your email verification. This code expires in 15 minutes.</p>
    </div>
    <div class="footer">
      <p>If you didn't request this code, please ignore this email.</p>
    </div>
  </div>
</body>
</html>
    `;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "verify@nervont.store",
        to: email,
        subject: "Your Verification Code",
        html: emailContent,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Resend API error: ${JSON.stringify(errorData)}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Email verification code sent",
        email,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to send email", details: String(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
