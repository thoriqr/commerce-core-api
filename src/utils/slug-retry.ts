export async function withSlugRetry<T>(fn: () => Promise<T>, attempt = 0): Promise<T> {
  try {
    return await fn();
  } catch (err: any) {
    // retry if unique violation
    if (err?.code === "23505" && attempt < 1) {
      return withSlugRetry(fn, attempt + 1);
    }
    throw err;
  }
}
