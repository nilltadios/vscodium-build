ARG BASE_IMAGE=docker.io/library/node:24.18.0-bookworm@sha256:4e9cb555d708e0829c9d93e5eeae9dfab0617b832ca436a690680e0fca735ef5
FROM ${BASE_IMAGE}
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential clang ccache git curl jq pkg-config python3 python3-setuptools \
    libx11-dev libxkbfile-dev libsecret-1-dev libkrb5-dev libssl-dev \
    libgtk-3-0 libnss3 libasound2 libgbm1 libxss1 libxshmfence1 \
    ca-certificates xz-utils zip unzip patch time \
    && rm -rf /var/lib/apt/lists/*
ENV npm_config_cache=/project/cache/npm \
    ELECTRON_CACHE=/project/cache/electron \
    XDG_CACHE_HOME=/project/cache/xdg \
    CCACHE_DIR=/project/cache/ccache \
    npm_config_jobs=4
WORKDIR /project
