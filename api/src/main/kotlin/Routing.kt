package dev.eliaschen.mito

import dev.eliaschen.mito.route.remote
import dev.eliaschen.mito.route.workout
import io.ktor.server.application.*
import io.ktor.server.routing.*

fun Application.configureRouting() {
    routing {
        workout()
        remote()
    }
}
