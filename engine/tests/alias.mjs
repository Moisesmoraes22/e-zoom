// Lets the tests import app code that uses the "@/..." alias and extension-less paths.
import { existsSync } from "node:fs"
import { registerHooks } from "node:module"
import { fileURLToPath, pathToFileURL } from "node:url"

const src = fileURLToPath(new URL("../../src/", import.meta.url))

registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith("@/")) {
      const base = src + specifier.slice(2)
      for (const candidate of [base, `${base}.ts`, `${base}.tsx`, `${base}/index.ts`]) {
        if (existsSync(candidate) && !candidate.endsWith("/")) {
          try {
            return next(pathToFileURL(candidate).href, context)
          } catch {}
        }
      }
    }
    return next(specifier, context)
  },
})
