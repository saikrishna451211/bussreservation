import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const langNames: Record<string, string> = {
  en: "English",
  hi: "Hindi",
  te: "Telugu",
  ml: "Malayalam",
  kn: "Kannada",
  ta: "Tamil",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transcript, cities, language = "en" } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const cityNames = cities?.join(", ") || "Chennai, Bangalore, Hyderabad, Mumbai, Delhi, Pune, Coimbatore, Madurai, Mysore, Goa";
    const langName = langNames[language] || "English";

    const systemPrompt = `You are BusBuddy, a friendly and warm bus booking assistant for India. You speak ONLY in ${langName} language.
You are like a helpful friend who speaks naturally in ${langName}. Use casual, warm, simple ${langName}.

Available cities: ${cityNames}

Given user speech, extract the intent and parameters. Always respond with a JSON object using the exact tool schema.

Rules:
- ALWAYS respond in ${langName} language. Never use English unless the user's language IS English.
- The user speaks ${langName}. Understand colloquial/casual ${langName}.
- Match city names fuzibly (e.g. "Bengaluru" = "Bangalore", "Bombay" = "Mumbai", "Madras" = "Chennai")
- If the user says "tomorrow", "today", "next Monday" etc., convert to YYYY-MM-DD format relative to today: ${new Date().toISOString().split("T")[0]}
- If a city is not in the available list, suggest the closest match in ${langName}
- Be like a friend chatting — warm, supportive, encouraging
- Keep language simple for uneducated users — use common everyday words in ${langName}
- If intent is unclear, ask a friendly clarifying question in ${langName}
- Add relevant emojis to make it friendly`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: transcript },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "parse_bus_intent",
                description: "Parse user speech into a bus booking intent",
                parameters: {
                  type: "object",
                  properties: {
                    intent: {
                      type: "string",
                      enum: ["search", "book", "status", "help", "unknown"],
                      description: "The user's intent",
                    },
                    from_city: {
                      type: "string",
                      description: "Departure city name (matched to available cities)",
                    },
                    to_city: {
                      type: "string",
                      description: "Destination city name (matched to available cities)",
                    },
                    date: {
                      type: "string",
                      description: "Travel date in YYYY-MM-DD format",
                    },
                    seats: {
                      type: "number",
                      description: "Number of seats requested",
                    },
                    booking_ref: {
                      type: "string",
                      description: "Booking reference if checking status",
                    },
                    response: {
                      type: "string",
                      description: `A friendly, warm, conversational response to the user in ${langName} language. Speak like a friend. Use simple everyday ${langName} words.`,
                    },
                  },
                  required: ["intent", "response"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "parse_bus_intent" },
          },
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limited. Please try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify(parsed), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fallback responses in the user's language
    const fallbacks: Record<string, string> = {
      en: "I'm sorry, I couldn't understand that. Could you try again?",
      hi: "माफ़ कीजिए, मैं समझ नहीं पाया। क्या आप फिर से कोशिश करेंगे?",
      te: "క్షమించండి, నాకు అర్థం కాలేదు. మళ్ళీ ప్రయత్నించగలరా?",
      ml: "ക്ഷമിക്കണം, എനിക്ക് മനസ്സിലായില്ല. ദയവായി വീണ്ടും ശ്രമിക്കാമോ?",
      kn: "ಕ್ಷಮಿಸಿ, ನನಗೆ ಅರ್ಥವಾಗಲಿಲ್ಲ. ಮತ್ತೊಮ್ಮೆ ಪ್ರಯತ್ನಿಸಬಹುದೇ?",
      ta: "மன்னிக்கவும், புரியவில்லை. மீண்டும் முயற்சிக்கவும்?",
    };

    return new Response(
      JSON.stringify({
        intent: "unknown",
        response: fallbacks[language] || fallbacks.en,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("voice-intent error:", e);
    return new Response(
      JSON.stringify({
        intent: "unknown",
        response: "Something went wrong. Please try again.",
        error: e instanceof Error ? e.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
