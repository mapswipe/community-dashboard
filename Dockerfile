FROM node:20-bookworm AS dev

LABEL maintainer="Mapswipe Dev"

RUN apt-get update -y \
    && apt-get install -y --no-install-recommends git \
    && rm -rf /var/lib/apt/lists/* \
    # NOTE: yarn > 1.22.19 breaks yarn-install invoked by pnpm
    && npm install -g pnpm@10.6.1 yarn@1.22.19 --force \
    && git config --global --add safe.directory /code

WORKDIR /code

# -------------------------- Nginx - Builder --------------------------------

FROM dev AS web-app-serve-build

COPY ./package.json ./pnpm-lock.yaml /code/

RUN pnpm install

COPY . /code/

# Build variables (Requires backend pulled)

ENV GRAPHQL_CODEGEN_ENDPOINT=./backend/schema.graphql
ENV APP_TITLE="Mapswipe Community Dashboard"
ENV APP_ENVIRONMENT=development
ENV APP_MAPSWIPE_WEBSITE=https://mapswipe.org
ENV APP_SENTRY_DSN=https://mapswipe.org

RUN pnpm generate:type && pnpm build
