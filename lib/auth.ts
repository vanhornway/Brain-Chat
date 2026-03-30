import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createAuthenticatedSupabaseClient() {
  const cookieStore = await cookies();

  // Use anon key to read session from cookies, not service key
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: "", ...options });
        },
      },
    }
  );
}

export async function getAuthenticatedUser() {
  const supabase = await createAuthenticatedSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.error("getUser error:", error.message, error.code);
    throw new Error(`User not found. ${error.message}`);
  }

  if (!user) {
    console.error("getUser returned no user");
    throw new Error("User not found");
  }

  return user;
}

export async function getAuthenticatedUserOrThrow() {
  const user = await getAuthenticatedUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}
