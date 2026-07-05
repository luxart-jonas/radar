// Supabase Edge Function: Proxy für airplanes.live ADS-B API
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const callsign = url.searchParams.get("callsign");

    if (!callsign) {
      return new Response(
        JSON.stringify({ error: "Parameter 'callsign' fehlt" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const upstream = await fetch(
      `https://api.airplanes.live/v2/callsign/${encodeURIComponent(callsign)}`,
      {
        headers: { "Accept": "application/json" },
        signal: AbortSignal.timeout(15000),
      }
    );

    if (!upstream.ok) {
      return new Response(
        JSON.stringify({ error: `airplanes.live antwortete mit HTTP ${upstream.status}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await upstream.text();
    return new Response(data, {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
