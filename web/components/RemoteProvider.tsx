"use client"

import {createContext, useCallback, useContext, useEffect, useRef, useState} from "react"
import {usePathname, useRouter} from "next/navigation"
import {RemoteAction, RemoteClient, RemoteSession} from "@/lib/remote"

type RemoteContextValue = {
    selfId: string | null
    selfName: string | null
    connected: boolean
    /** Active controllable devices (clients currently on the remote-control page) */
    clients: RemoteClient[]
    /** Non-null while this client is being remote controlled */
    session: RemoteSession | null
    sendControl: (targets: string[], action: RemoteAction) => void
}

const RemoteContext = createContext<RemoteContextValue | null>(null)

export function useRemote() {
    const ctx = useContext(RemoteContext)
    if (!ctx) throw new Error("useRemote must be used within RemoteProvider")
    return ctx
}

export default function RemoteProvider({wsUrl, children}: { wsUrl: string; children: React.ReactNode }) {
    const router = useRouter()
    const pathname = usePathname()
    const [selfId] = useState(() => crypto.randomUUID())
    const socketRef = useRef<WebSocket | null>(null)
    const [selfName, setSelfName] = useState<string | null>(null)
    const [connected, setConnected] = useState(false)
    const [clients, setClients] = useState<RemoteClient[]>([])
    const [session, setSession] = useState<RemoteSession | null>(null)

    // Only the "/" page acts as a controllable device; a client being controlled stays one
    const role = pathname === "/" || session !== null ? "device" : "controller"
    const roleRef = useRef(role)

    // Latest pathname for use inside socket handlers (the effect runs once)
    const pathnameRef = useRef(pathname)
    useEffect(() => {
        pathnameRef.current = pathname
    }, [pathname])

    useEffect(() => {
        let disposed = false
        let reconnectTimer: ReturnType<typeof setTimeout> | null = null

        function goToPlayer(workoutId: string) {
            if (pathnameRef.current !== `/player/${workoutId}`) {
                router.push(`/player/${workoutId}`)
            }
        }

        function connect() {
            if (disposed) return
            const socket = new WebSocket(wsUrl)
            socketRef.current = socket

            socket.onopen = () => {
                setConnected(true)
                socket.send(JSON.stringify({type: "hello", id: selfId, role: roleRef.current}))
            }

            socket.onmessage = event => {
                let message: Record<string, unknown>
                try {
                    message = JSON.parse(event.data as string)
                } catch {
                    return
                }
                if (message.type === "welcome") {
                    setSelfName(message.name as string)
                } else if (message.type === "clients") {
                    setClients(message.clients as RemoteClient[])
                } else if (message.type === "control") {
                    const action = message.action as RemoteAction
                    const controllerName = message.fromName as string
                    if (action.kind === "connect") {
                        setSession({
                            controllerName,
                            workout: action.workout,
                            mode: "once",
                            times: 1,
                            status: "idle",
                            startedAt: 0,
                        })
                        goToPlayer(action.workout.id)
                    } else if (action.kind === "start") {
                        setSession({
                            controllerName,
                            workout: action.workout,
                            mode: action.mode,
                            times: action.times,
                            status: "playing",
                            startedAt: Date.now(),
                        })
                        goToPlayer(action.workout.id)
                    } else if (action.kind === "pause") {
                        setSession(prev => (prev ? {...prev, status: "paused"} : prev))
                    } else if (action.kind === "resume") {
                        setSession(prev => (prev ? {...prev, status: "playing"} : prev))
                    } else if (action.kind === "stop") {
                        // Reset but stay on the player until the controller disconnects
                        setSession(prev => (prev ? {...prev, status: "idle", startedAt: 0} : prev))
                    } else if (action.kind === "disconnect") {
                        setSession(null)
                        router.push("/")
                    }
                }
            }

            socket.onclose = () => {
                setConnected(false)
                setClients([])
                if (!disposed) reconnectTimer = setTimeout(connect, 2000)
            }
            socket.onerror = () => socket.close()
        }

        connect()
        return () => {
            disposed = true
            if (reconnectTimer) clearTimeout(reconnectTimer)
            socketRef.current?.close()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [wsUrl, selfId])

    // Re-announce whenever the role flips (entering/leaving the device page)
    useEffect(() => {
        roleRef.current = role
        const socket = socketRef.current
        if (socket?.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({type: "hello", id: selfId, role}))
        }
    }, [role, selfId])

    const sendControl = useCallback((targets: string[], action: RemoteAction) => {
        const socket = socketRef.current
        if (!socket || socket.readyState !== WebSocket.OPEN || targets.length === 0) return
        socket.send(JSON.stringify({type: "control", targets, action}))
    }, [])

    return (
        <RemoteContext.Provider
            value={{selfId, selfName, connected, clients, session, sendControl}}
        >
            {children}
        </RemoteContext.Provider>
    )
}
