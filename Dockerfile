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
ENV APP_GA_TRACKING_ID=temp
ENV APP_GRAPHQL_CODEGEN_ENDPOINT=./backend/schema.graphql

RUN pnpm generate:type && WEB_APP_SERVE_ENABLED=true pnpm build

# ---------------------------------------------------------------------
# Final image using web-app-serve

FROM ghcr.io/toggle-corp/web-app-serve:v0.1.2 AS web-app-serve

LABEL org.opencontainers.image.source="https://github.com/my-org/my-best-dashboard"
LABEL org.opencontainers.image.authors="my-email@company.com"

# Env for apply-config script
ENV APPLY_CONFIG__SOURCE_DIRECTORY=/code/build/

COPY --from=web-app-serve-build /code/build "$APPLY_CONFIG__SOURCE_DIRECTORY"
