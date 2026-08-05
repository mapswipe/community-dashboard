/**
 * Reads a config value that is only real once the container starts.
 *
 * Under web-app-serve the `import.meta.env.APP_*` defines are replaced at build
 * time by placeholder string literals, and the real values are substituted into
 * the bundle at container start. A bundler can evaluate any expression over a
 * literal, so `if (someVar)`, `someVar ? a : b` and `someVar === 'X'` are all
 * folded against the placeholder — the guard is gone before the runtime value
 * ever exists. The `String(...)` call below is what a bundler cannot evaluate,
 * so every check written against the result happens in the browser. Do not
 * "simplify" it away.
 *
 * Returns `undefined` for a value that was never supplied: apply-config rewrites
 * a variable with no runtime value to the `undefined` token, and a variable set
 * to an empty string means the same thing. (A value of literally "undefined" is
 * treated as unset too — it can only come from a misconfigured deployment.)
 */
// eslint-disable-next-line import/prefer-default-export
export function readRuntimeConfig<T extends string>(value: T | undefined): T | undefined {
    const raw = String(value ?? '');

    if (raw.length === 0 || raw === 'undefined') {
        return undefined;
    }

    return raw as T;
}
