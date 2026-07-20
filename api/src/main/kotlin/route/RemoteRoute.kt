package dev.eliaschen.mito.route

import io.ktor.server.routing.Route
import io.ktor.server.websocket.DefaultWebSocketServerSession
import io.ktor.server.websocket.webSocket
import io.ktor.websocket.Frame
import io.ktor.websocket.readText
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.buildJsonArray
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.put
import java.util.concurrent.ConcurrentHashMap

@Serializable
data class RemoteClient(val id: String, val name: String)

object RemoteHub {
    private class Entry(
        val info: RemoteClient,
        val session: DefaultWebSocketServerSession,
        @Volatile var role: String,
    )

    private val clients = ConcurrentHashMap<String, Entry>()

    private val controlling = ConcurrentHashMap<String, List<String>>()

    private val fruits = listOf(
        "蘋果", "香蕉", "芒果", "荔枝", "鳳梨", "草莓", "葡萄", "檸檬",
        "櫻桃", "柳丁", "藍莓", "西瓜", "芭樂", "水蜜桃", "奇異果", "哈密瓜",
    )
    private val animals = listOf(
        "貓咪", "小狗", "兔子", "老虎", "獅子", "熊貓", "海豚", "企鵝",
        "松鼠", "刺蝟", "狐狸", "浣熊", "鯨魚", "樹懶", "貓頭鷹", "無尾熊",
    )
    private val places = listOf(
        "哥本哈根", "東京", "巴黎", "倫敦", "紐約", "首爾", "曼谷", "雪梨",
        "柏林", "羅馬", "台灣", "京都", "馬德里", "赫爾辛基", "阿姆斯特丹", "斯德哥爾摩", "烏干達"
    )

    private fun uniqueName(): String {
        while (true) {
            val name = "${fruits.random()}-${animals.random()}-${places.random()}"
            if (clients.values.none { it.info.name == name }) return name
        }
    }

    suspend fun register(id: String, role: String, session: DefaultWebSocketServerSession): RemoteClient {
        val info = clients[id]?.info ?: RemoteClient(id, uniqueName())
        clients[id] = Entry(info, session, role)
        broadcastClients()
        return info
    }

    suspend fun remove(id: String, session: DefaultWebSocketServerSession) {
        val entry = clients[id] ?: return
        if (entry.session === session) {
            clients.remove(id)
            controlling.remove(id)?.let { targets ->
                sendToTargets(entry.info, targets, buildJsonObject { put("kind", "disconnect") })
            }
            broadcastClients()
        }
    }

    suspend fun relay(fromId: String, targets: List<String>, action: JsonElement) {
        val from = clients[fromId]?.info ?: return
        when ((action as? JsonObject)?.get("kind")?.jsonPrimitive?.contentOrNull) {
            "connect", "start" -> controlling[fromId] = targets
            "disconnect" -> controlling.remove(fromId)
        }
        sendToTargets(from, targets, action)
    }

    private suspend fun sendToTargets(from: RemoteClient, targets: List<String>, action: JsonElement) {
        val text = buildJsonObject {
            put("type", "control")
            put("from", from.id)
            put("fromName", from.name)
            put("action", action)
        }.toString()
        targets.forEach { target ->
            clients[target]?.let { runCatching { it.session.send(Frame.Text(text)) } }
        }
    }

    private suspend fun broadcastClients() {
        // Only devices (clients sitting on the remote-control page) are controllable targets
        val text = buildJsonObject {
            put("type", "clients")
            put("clients", buildJsonArray {
                clients.values.filter { it.role == "device" }.forEach { entry ->
                    add(buildJsonObject {
                        put("id", entry.info.id)
                        put("name", entry.info.name)
                    })
                }
            })
        }.toString()
        clients.values.forEach { runCatching { it.session.send(Frame.Text(text)) } }
    }
}

fun Route.remote() {
    webSocket("/remote") {
        var clientId: String? = null
        try {
            for (frame in incoming) {
                val text = (frame as? Frame.Text)?.readText() ?: continue
                val message = runCatching { Json.parseToJsonElement(text).jsonObject }.getOrNull() ?: continue
                when (message["type"]?.jsonPrimitive?.contentOrNull) {
                    "hello" -> {
                        val id = message["id"]?.jsonPrimitive?.contentOrNull ?: continue
                        val role = message["role"]?.jsonPrimitive?.contentOrNull ?: "controller"
                        clientId = id
                        val info = RemoteHub.register(id, role, this)
                        send(Frame.Text(buildJsonObject {
                            put("type", "welcome")
                            put("id", info.id)
                            put("name", info.name)
                        }.toString()))
                    }

                    "control" -> {
                        val from = clientId ?: continue
                        val targets = message["targets"]?.jsonArray
                            ?.mapNotNull { it.jsonPrimitive.contentOrNull }
                            ?: emptyList()
                        val action = message["action"] ?: continue
                        RemoteHub.relay(from, targets, action)
                    }
                }
            }
        } finally {
            clientId?.let { RemoteHub.remove(it, this) }
        }
    }
}
