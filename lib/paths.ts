/**
 * The app is mounted under this sub-path (mirrors `basePath` in next.config.ts).
 * Kept in a dependency-free module so both the Next config and client code can
 * import it without pulling in unrelated modules.
 */
export const BASE_PATH = "/mantis";
