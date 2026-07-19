package dev.eliaschen.mito.db

import com.mongodb.client.model.Filters.eq
import com.mongodb.client.model.Filters.regex
import com.mongodb.client.model.Sorts
import kotlinx.coroutines.flow.count
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.flow.toList
import kotlinx.serialization.Serializable
import org.bson.codecs.pojo.annotations.BsonId
import org.bson.types.ObjectId
import java.time.Instant

@Serializable
data class Workout(
    @BsonId val id: String = ObjectId().toHexString(),
    val name: String,
    val description: String,
    val poses: List<Pose> = emptyList(),
    val createdAt: String = Instant.now().toString(),
    val updatedAt: String = Instant.now().toString(),
)

@Serializable
data class WorkoutPayload(
    val name: String,
    val description: String,
    val poses: List<PosePayload> = emptyList(),
)

@Serializable
data class Pagination(
    val totalItem: Int,
    val totalPage: Int,
    val currentPage: Int,
)

@Serializable
data class WorkoutResponse(
    val page: Pagination,
    val data: List<Workout>
)

private fun List<PosePayload>.toPoses(): List<Pose> {
    return map { Pose(location = it.location, delayMillis = it.delayMillis) }
}

object WorkoutDao {
    private val collection get() = Mongo.database.getCollection<Workout>("workouts")

    suspend fun getAll(search: String, limit: Int, page: Int): WorkoutResponse {
        val data = collection.find(regex("name", ".*$search.*"))
            .sort(Sorts.descending("updatedAt"))
        val pagination = Pagination(data.count(), data.count() / limit + if (data.count() % limit != 0) 1 else 0, page)
        val list = data.skip((page - 1) * limit)
            .limit(limit)
            .toList()

        return WorkoutResponse(pagination, list)
    }

    suspend fun getById(id: String): Workout? {
        return collection.find(eq("_id", id)).firstOrNull()
    }

    suspend fun insert(payload: WorkoutPayload): Workout {
        val workout = Workout(
            name = payload.name,
            description = payload.description,
            poses = payload.poses.toPoses(),
        )
        collection.insertOne(workout)
        return workout
    }

    suspend fun update(id: String, payload: WorkoutPayload): Workout? {
        val existing = getById(id) ?: return null
        val updated = existing.copy(
            name = payload.name,
            description = payload.description,
            poses = payload.poses.toPoses(),
            updatedAt = Instant.now().toString(),
        )
        collection.replaceOne(eq("_id", id), updated)
        return updated
    }

    suspend fun delete(id: String): Boolean {
        return collection.deleteOne(eq("_id", id)).deletedCount > 0
    }
}
