// src/core/repositories/index.ts
/**
 * Repository lifecycle is managed by the auth provider shell so repositories
 * stay focused on persistence and listeners instead of session orchestration.
 */
export const initializeOfflineRepositories = async () => {
  // Initialization is handled by initializeRepositories() in repositoryLifecycle.ts
};
