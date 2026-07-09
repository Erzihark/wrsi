import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['**/*.test.ts'],
    // These suites hit a live local Supabase stack, so allow for network latency
    // and run files serially to keep shared-DB fixtures predictable.
    testTimeout: 30000,
    hookTimeout: 30000,
    fileParallelism: false,
  },
});
