FROM node:20-bookworm AS dev

LABEL maintainer="Mapswipe Dev"

RUN apt-get update -y \
    && apt-get install -y --no-install-recommends git \
    && rm -rf /var/lib/apt/lists/* \
    && npm install -g pnpm@10.6.1 --force \
    && git config --global --add safe.directory /code

WORKDIR /code

# -------------------------- Builder ---------------------------------------

FROM dev AS builder

RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=pnpm-lock.yaml,target=pnpm-lock.yaml \
    pnpm install --frozen-lockfile

COPY . /code/

# -------------------------- web-app-serve- Builder --------------------------------

FROM builder AS web-app-serve-build

# Build variables (Requires backend pulled)

ENV APP_GRAPHQL_ENDPOINT=http://localhost:8000/graphql/
ENV APP_BACKEND_ENDPOINT=http://localhost:8000/
ENV APP_ENVIRONMENT=DEV
ENV APP_SENTRY_DSN=temp
ENV APP_SENTRY_TRACES_SAMPLE_RATE=temp
ENV APP_GA_TRACKING_ID=temp
ENV APP_GRAPHQL_CODEGEN_ENDPOINT=./backend/schema.graphql

RUN pnpm generate:type && WEB_APP_SERVE_ENABLED=true pnpm build

# ---------------------------------------------------------------------
# Final image using web-app-serve

FROM ghcr.io/toggle-corp/web-app-serve:v0.1.2 AS web-app-serve

LABEL org.opencontainers.image.source="https://github.com/mapswipe/community-dashboard"
LABEL org.opencontainers.image.authors="Mapswipe Dev"

# Env for apply-config script (base image only presets DESTINATION_DIRECTORY)
ENV APPLY_CONFIG__SOURCE_DIRECTORY=/code/build/

COPY --from=web-app-serve-build /code/build "$APPLY_CONFIG__SOURCE_DIRECTORY"

# Ship a hardened custom apply-config (grep ^APP_) instead of the base image's
# stock default-app-apply-config.sh. The stock script neither escapes sed
# replacement metacharacters (a value containing & corrupts silently, | exits the
# container) nor handles unfilled markers, so an unset var leaked the literal
# WEB_APP_SERVE_PLACEHOLDER__* marker into the bundle — truthy garbage fed to
# Sentry (APP_SENTRY_DSN) and Google Analytics (APP_GA_TRACKING_ID).
# See ./web-app-serve/apply-config.sh.
COPY ./web-app-serve/apply-config.sh /web-app-serve/app-apply-config.sh
RUN chmod +x /web-app-serve/app-apply-config.sh
ENV APPLY_CONFIG__APPLY_CONFIG_PATH=/web-app-serve/app-apply-config.sh

# NOTE: APP_ENVIRONMENT is baked with a default here so the substitution loop
# always fills it — it is interpolated into a larger string literal
# (`MAPSWIPE-${APP_ENVIRONMENT}-CSRFTOKEN` in app/Base/configs/apollo.ts), which
# the quoted-JS `undefined` rewrite deliberately does not touch, so an unset
# value would leak the raw marker. It stays runtime-overridable (apply-config
# substitutes it like any other var) and **every deployment must set it** — the
# CSRF cookie name (`MAPSWIPE-<ENV>-CSRFTOKEN`) must match the backend's, so a
# deployment that relies on this fallback will fail every CSRF-protected
# mutation. The value is deliberately "UNSET" rather than a real environment
# name (DEV/STAGE/PROD): it only exists to keep the marker from leaking, and an
# obviously-bogus value makes a deployment that forgot to set the variable
# self-evident in the CSRF cookie name, the Sentry environment tag and the
# rendered config.
ENV APP_ENVIRONMENT=UNSET
