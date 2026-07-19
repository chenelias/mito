# --- STAGE 1: Build Flutter Web App ---
FROM debian:stable-slim AS build-env

# Install dependencies required by Flutter
RUN apt-get update && apt-get install -y curl git unzip xz-utils zip libglu1-mesa

# Setup Flutter SDK path explicitly
WORKDIR /
RUN git clone https://github.com/flutter/flutter.git -b stable --depth 1

# Permanent environment path mapping
ENV FLUTTER_HOME="/"
ENV PATH="/flutter/bin:/flutter/bin/cache/dart-sdk/bin:${PATH}"

# Pre-download Flutter assets and run toolchain checks
RUN flutter doctor

# Set up our application working directory
WORKDIR /app
COPY . .

# Run the highly optimized WebAssembly build 
RUN flutter build web --wasm

# --- STAGE 2: Serve via High-Performance Nginx ---
FROM nginx:alpine

# Copy our custom mimetype config to support WASM headers
COPY nginx.conf /etc/nginx/nginx.conf

# Copy compiled WASM web assets from Stage 1 into Nginx static assets path
COPY --from=build-env /app/build/web /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]