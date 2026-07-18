package dev.eliaschen.mito

import com.asyncapi.kotlinasyncapi.context.service.AsyncApiExtension
import com.asyncapi.kotlinasyncapi.ktor.AsyncApiPlugin
import dev.eliaschen.mito.db.ErrorResponse
import dev.eliaschen.mito.db.Mongo
import io.github.smiley4.ktoropenapi.OpenApi
import io.github.smiley4.ktoropenapi.openApi
import io.github.smiley4.ktorswaggerui.swaggerUI
import io.ktor.http.HttpStatusCode
import io.ktor.serialization.kotlinx.json.*
import io.ktor.server.application.*
import io.ktor.server.plugins.contentnegotiation.*
import io.ktor.server.plugins.cors.routing.*
import io.ktor.server.plugins.statuspages.StatusPages
import io.ktor.server.response.respond
import io.ktor.server.routing.*
import io.ktor.server.websocket.*
import kotlin.time.Duration.Companion.seconds

fun main(args: Array<String>) {
    io.ktor.server.netty.EngineMain.main(args)
}

fun Application.module() {
    install(ContentNegotiation) {
        json()
    }

    install(CORS) {
        anyHost()
        allowNonSimpleContentTypes = true
    }

    install(WebSockets) {
        pingPeriod = 15.seconds
        timeout = 15.seconds
        maxFrameSize = Long.MAX_VALUE
        masking = false
    }

    install(AsyncApiPlugin) {
        extension = AsyncApiExtension.builder {
            info {
                title("Mito Backend")
                version("1.0.0")
            }
        }
    }
    install(OpenApi) {
        info {
            title = "Mito Backend"
            version = "1.0.0"
            description = "backend API service for mito application"
        }
        pathFilter = { _, url -> url.firstOrNull() != "docs" }
    }
    connectToDatabase()
    install(StatusPages) {
        exception<Throwable> { call, cause ->
            call.respond(
                HttpStatusCode.InternalServerError,
                ErrorResponse(cause.localizedMessage ?: "An unexpected error occurred")
            )
        }
    }
    routing {
        route("api.json") {
            openApi()
        }
        route("docs") {
            swaggerUI("/api.json")
        }
    }
    configureRouting()
}

fun connectToDatabase() {
    Mongo.connect(
        url = System.getenv("DATABASE_URL") ?: "mongodb://mongo:mongo@localhost:27017",
        databaseName = System.getenv("DATABASE_NAME") ?: "app",
    )
}
