package dev.eliaschen.mito

import io.ktor.client.request.get
import io.ktor.http.HttpStatusCode
import io.ktor.server.testing.testApplication
import kotlin.test.*

class ServerTest {

    @Test
    fun `test docs endpoint`() = testApplication {
        // loads default configuration
        configure()
        // verify the API docs page returns 200
        assertEquals(HttpStatusCode.OK, client.get("/docs").status)
    }

}
