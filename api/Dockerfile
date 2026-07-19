# Build stage
FROM eclipse-temurin:21-jdk AS build
WORKDIR /app

# Copy build scripts first so dependency downloads are cached between builds
COPY gradlew gradle.properties settings.gradle.kts build.gradle.kts ./
COPY gradle ./gradle
RUN chmod +x ./gradlew && ./gradlew --no-daemon dependencies --quiet || true

COPY src ./src
RUN ./gradlew --no-daemon buildFatJar

# Runtime stage
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/build/libs/backend-all.jar app.jar

# Configure at runtime:
#   DATABASE_URL  (e.g. mongodb://user:pass@mongo:27017)
#   DATABASE_NAME (defaults to "app" in the application)
EXPOSE 8080
CMD ["java", "-jar", "app.jar"]
