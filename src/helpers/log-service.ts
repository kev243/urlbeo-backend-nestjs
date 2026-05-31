export function logServiceError(context: string, error: unknown) {
  const safeError = typeof error === 'object' && error !== null ? error : {};
  // eslint-disable-next-line no-console
  console.error(`[${context}] Erreur:`, {
    name: (safeError as any).name,
    message: (safeError as any).message,
    code: (safeError as any).code,
  });
}
