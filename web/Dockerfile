# Build stage — install Flutter at the exact version this project requires
FROM debian:bookworm-slim AS build
ARG FLUTTER_VERSION=3.44.6

RUN apt-get update \
    && apt-get install -y --no-install-recommends git curl unzip xz-utils zip ca-certificates \
    && rm -rf /var/lib/apt/lists/*
RUN git clone --depth 1 --branch ${FLUTTER_VERSION} https://github.com/flutter/flutter.git /opt/flutter
ENV PATH="/opt/flutter/bin:$PATH"
ENV PORT=80
RUN flutter --version && flutter precache --web

WORKDIR /app

# Resolve dependencies first so they are cached between builds
COPY pubspec.yaml pubspec.lock ./
RUN flutter pub get

COPY . .
RUN flutter build web --release

# Runtime stage
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/build/web /usr/share/nginx/html
EXPOSE 80
