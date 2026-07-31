export function logServiceError(context: string, error: unknown) {
  const safeError =
    typeof error === 'object' && error !== null
      ? (error as { name?: unknown; message?: unknown; code?: unknown })
      : {};
  console.error(`[${context}] Erreur:`, {
    name: safeError.name,
    message: safeError.message,
    code: safeError.code,
  });
}
