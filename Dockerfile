FROM node:20-bookworm AS dev

LABEL maintainer="Mapswipe Dev"

RUN apt-get update -y \
    && apt-get install -y --no-install-recommends \
        git bash g++ make \
    && git config --global --add safe.directory /code \
    && rm -rf /var/lib/apt/lists/*

RUN --mount=type=bind,source=package.json,target=package.json \
    corepack install && corepack enable

WORKDIR /code

COPY . .

FROM dev AS full-client

COPY ./package.json ./yarn.lock /code/
RUN yarn install --frozen-lockfile
