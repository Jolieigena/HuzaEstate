# Maintenance scripts

Run these only when intentionally changing demo fixtures. They are not part of
application startup, tests, or the production build.

## Property fixture generator

```bash
node scripts/generate-properties.mjs
```

The generator replaces `src/lib/properties/fixtures.ts` with randomized demo
properties using its embedded location and image lists. It resolves the output
relative to the script, so the current working directory does not affect the
target. It imports the shared `Property` contract rather than generating a
second copy. Existing property types and compatibility exports are preserved.

Generated values will differ on each run. Review the fixture diff before
keeping the output. The structural cleanup does not regenerate this data.
