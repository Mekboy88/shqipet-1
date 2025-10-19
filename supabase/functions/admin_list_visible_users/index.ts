// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  limit?: number;
  offset?: number;
  search?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return new Response(JSON.stringify({ error: "Missing server configuration" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Parse body
    const body = (await req.json().catch(() => ({}))) as RequestBody;
    const limit = Math.min(Math.max(body.limit ?? 50, 1), 200);
    const offset = Math.max(body.offset ?? 0, 0);
    const search = (body.search ?? "").trim();

    // Create an auth-bound client to identify the caller
    const anonClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userRes } = await anonClient.auth.getUser();
    const callerId = userRes?.user?.id;
    if (!callerId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Authorize: platform owner or admin/super_admin can access
    const { data: accessAllowed, error: accessErr } = await anonClient.rpc(
      "validate_admin_access",
      { required_action: "access_admin_portal" }
    );
    if (accessErr) {
      console.error("validate_admin_access error:", accessErr.message);
      return new Response(JSON.stringify({ error: "Access validation failed" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (!accessAllowed) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Use service role to bypass RLS safely after authorization
    const serviceClient = createClient(supabaseUrl, serviceRoleKey);

    let query = serviceClient
      .from("profiles")
      .select(
        `id, auth_user_id, first_name, last_name, email, username, phone_number,
         avatar_url, primary_role, is_hidden, account_status, created_at, updated_at`,
        { count: "exact" }
      )
      .eq("is_hidden", false)
      .neq("primary_role", "platform_owner_root")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      const s = `%${search}%`;
      query = query.or(
        `username.ilike.${s},first_name.ilike.${s},last_name.ilike.${s},email.ilike.${s}`
      );
    }

    const { data, error, count } = await query;
    if (error) {
      console.error("profiles query error:", error.message);
      return new Response(JSON.stringify({ error: "Query failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(
      JSON.stringify({ users: data ?? [], count: count ?? 0 }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("admin_list_visible_users fatal:", err?.message || err);
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
