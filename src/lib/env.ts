function getEnv(name: string): string {
  const value = process.env[name];
  if (value === undefined || value === "") {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

export const env = {
  SUPABASE_URL: getEnv("NEXT_PUBLIC_SUPABASE_URL"),
  SUPABASE_ANON_KEY: getEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
};
