/**
 * It's used to act on the process's unhandledRejection & uncaughtException Events
 * 
 * Used in top of the entry point,
 * before any function that raises exceptions.
 */
export function on_process_failure() {
  process.on('unhandledRejection', (error: Error) => {
    console.error("unhandledRejection", error.message)
    throw error;
  });

  process.on('uncaughtException', async (error: Error) => {
    console.error("uncaughtException", error.message)
    process.exit(1);
  });
}