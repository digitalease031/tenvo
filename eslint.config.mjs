import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
    ...nextVitals,
    ...nextTs,
    {
        rules: {
            // Prevent malformed JSDoc comments that can break method definitions
            'no-irregular-whitespace': ['error', {
                skipComments: false,
                skipRegExps: false,
                skipTemplates: false,
            }],
            // Warn about potential JSDoc issues
            'spaced-comment': ['warn', 'always', {
                markers: ['/'],
                exceptions: ['*'],
            }],
        },
    },
    // Override default ignores of eslint-config-next.
    globalIgnores([
        // Default ignores of eslint-config-next:
        ".next/**",
        "out/**",
        "build/**",
        "next-env.d.ts",
    ]),
]);

export default eslintConfig;
