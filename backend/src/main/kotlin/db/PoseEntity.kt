package dev.eliaschen.mito.db

import kotlinx.serialization.Serializable
import org.bson.types.ObjectId
import java.time.Instant

@Serializable
data class Pose(
    val id: String = ObjectId().toHexString(),
    val location: Int,
    val delayMillis: Long,
    val createdAt: String = Instant.now().toString(),
)

@Serializable
data class PosePayload(
    val location: Int,
    val delayMillis: Long,
)
