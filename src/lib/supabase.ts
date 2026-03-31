import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        flowType: 'implicit',
        detectSessionInUrl: true,
        persistSession: true,
      },
    }
  );
}

let clientInstance: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabase() {
  if (!clientInstance) {
    clientInstance = createClient();
  }
  return clientInstance;
}

export async function callEdgeFunction<T = unknown>(
  functionName: string,
  body: Record<string, unknown>
): Promise<{ data: T | null; error: { code: string; message: string } | null }> {
  const supabase = getSupabase();
  const { data, error } = await supabase.functions.invoke(functionName, { body });
  if (error) {
    return { data: null, error: { code: "FUNCTION_ERROR", message: error.message } };
  }
  return data as { data: T | null; error: { code: string; message: string } | null };
}
