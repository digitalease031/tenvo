import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
        environment: 'node',
        include: ['tests/unit/ReservationUUIDFix.test.js'],
        // Don't use the global setup that imports React Testing Library
        setupFiles: ['./vitest.reservation.setup.js'],
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, '.'),
        },
    },
});
