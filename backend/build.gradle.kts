plugins {
    alias(libs.plugins.kotlin.jvm)
    alias(ktorLibs.plugins.ktor)
    alias(libs.plugins.kotlin.serialization)
}

group = "dev.eliaschen.mito"
version = "1.0.0-SNAPSHOT"

application {
    mainClass = "io.ktor.server.netty.EngineMain"
}

kotlin {
    jvmToolchain(21)
}
dependencies {
    implementation(ktorLibs.serialization.kotlinx.json)
    implementation(ktorLibs.server.config.yaml)
    implementation(ktorLibs.server.contentNegotiation)
    implementation(ktorLibs.server.core)
    implementation(ktorLibs.server.cors)
    implementation(ktorLibs.server.netty)
    implementation(ktorLibs.server.websockets)
    implementation(libs.mongodb.driver.kotlin.coroutine)
    implementation(libs.logback.classic)
    implementation(libs.openfolder.kotlinAsyncapiKtor) {
        exclude(group = "io.swagger.core.v3", module = "swagger-core-jakarta")
        exclude(group = "io.swagger.core.v3", module = "swagger-models-jakarta")
        exclude(group = "io.swagger.core.v3", module = "swagger-annotations-jakarta")
    }
    implementation("io.ktor:ktor-server-status-pages:3.5.0")
    implementation(libs.smiley4.ktor.openapi)
    implementation(libs.smiley4.ktor.swagger.ui)
    testImplementation(kotlin("test"))
    testImplementation(ktorLibs.server.testHost)

}