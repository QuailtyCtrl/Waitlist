import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface SMSRequest {
  phone: string;
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
    const { phone, code }: SMSRequest = await req.json();

    if (!phone || !code) {
      return new Response(
        JSON.stringify({ error: "Phone and code are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioPhoneNumber = Deno.env.get("TWILIO_PHONE_NUMBER");

    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
      throw new Error("Twilio credentials are not configured");
    }

    const message = `Nervont: Limited Collections - Your verification code is: ${code}. This code expires in 15 minutes.`;

    const formData = new URLSearchParams();
    formData.append("From", twilioPhoneNumber);
    formData.append("To", phone);
    formData.append("Body", message);

    const auth = btoa(`${twilioAccountSid}:${twilioAuthToken}`);

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          "Authorization": `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Twilio API error: ${JSON.stringify(errorData)}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "SMS verification code sent",
        phone,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to send SMS", details: String(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
