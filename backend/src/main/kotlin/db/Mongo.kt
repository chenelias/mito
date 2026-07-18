package dev.eliaschen.mito.db

import com.mongodb.kotlin.client.coroutine.MongoClient
import com.mongodb.kotlin.client.coroutine.MongoDatabase

object Mongo {
    lateinit var database: MongoDatabase

    fun connect(url: String, databaseName: String) {
        database = MongoClient.create(url).getDatabase(databaseName)
    }
}
