export type Result<T> = { success: true; result: T } | { success: false; error: unknown }
