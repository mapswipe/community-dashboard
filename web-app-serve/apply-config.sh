#!/bin/env bash

set -xe

# Substitute WEB_APP_SERVE_PLACEHOLDER__<VAR> markers with runtime values.
# Based on the base image's default-app-apply-config.sh (which also handles
# ^APP_), but hardened with two conventions the stock script lacks:
#   1. sed replacement metacharacters are escaped so values substitute literally
#      (a Sentry DSN or endpoint containing & or | otherwise corrupts the bundle
#      silently, or exits the container);
#   2. unfilled placeholders are resolved to JS `undefined` (quoted JS markers
#      only) and every leftover is warned about on stderr — an unset
#      APP_SENTRY_DSN / APP_GA_TRACKING_ID would otherwise leak the literal
#      marker, a truthy string that inits Sentry with an invalid DSN and Google
#      Analytics with a bogus tracking id.
# APP_ENVIRONMENT additionally appears inside a larger string literal
# (`MAPSWIPE-${APP_ENVIRONMENT}-CSRFTOKEN`), which the quoted-JS rewrite below
# intentionally does not touch; it has a baked default in the Dockerfile final
# stage so the substitution loop always fills it.
while IFS='=' read -r KEY VALUE; do
    # Escape sed replacement metacharacters (\, & and the | delimiter) so
    # URLs/tokens containing them substitute literally
    ESCAPED_VALUE=$(printf '%s' "$VALUE" | sed -e 's/[\\&|]/\\&/g')
    find "$DESTINATION_DIRECTORY" -type f \
        -exec sed -i "s|\<WEB_APP_SERVE_PLACEHOLDER__$KEY\>|$ESCAPED_VALUE|g" {} +
done < <(env | grep '^APP_')

# Resolve unfilled placeholders to real JS `undefined` (falsy) instead of
# leaking the literal marker (a truthy string) into the bundle. The
# overrideDefineForWebAppServe emits the marker JSON-stringified (quoted), so
# consuming the surrounding quotes turns `"WEB_APP_SERVE_PLACEHOLDER__APP_X"`
# into a bare `undefined`. Warn about every leftover first — including unquoted
# occurrences the rewrite leaves in place (the fix for those is a baked default
# in the Dockerfile final stage, or setting the variable).
LEFTOVER_PLACEHOLDERS=$(grep -rho 'WEB_APP_SERVE_PLACEHOLDER__APP_[A-Za-z0-9_]*' "$DESTINATION_DIRECTORY" | sort -u)
if [ -n "$LEFTOVER_PLACEHOLDERS" ]; then
    echo "WARNING: no runtime value for the placeholder(s) below — quoted JS occurrences set to 'undefined'; any unquoted occurrence is left in place:" >&2
    printf '%s\n' "$LEFTOVER_PLACEHOLDERS" | sed 's/^/  - /' >&2
fi
find "$DESTINATION_DIRECTORY" -type f \
    -exec sed -i 's|"WEB_APP_SERVE_PLACEHOLDER__APP_[A-Za-z0-9_]*"|undefined|g' {} +
