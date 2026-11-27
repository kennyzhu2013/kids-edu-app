export async function register() {
  const { assertProductionDatabase } = await import("@/lib/api/secrets");
  assertProductionDatabase();
}
