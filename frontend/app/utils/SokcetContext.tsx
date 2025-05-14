"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";

type SocketContextType = {
    socket: WebSocket | null;
    sendMessage: (message: string) => void;
};

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const socketRef = useRef<WebSocket | null>(null);
    const [socket, setSocket] = useState<WebSocket | null>(null);

    useEffect(() => {
        if (!socketRef.current || socketRef.current.readyState === WebSocket.CLOSED) {
            const ws = new WebSocket("ws://localhost:8080");
            socketRef.current = ws;
            setSocket(ws);

            ws.onopen = () => {
                console.log("WebSocket connection established");
            };

            ws.onclose = () => {
                console.log("WebSocket connection closed");
            };

            ws.onerror = (error) => {
                console.error("WebSocket error:", error);
            };
        }

        return () => {
            if (socketRef.current) {
                socketRef.current.close();
            }
        };
    }, []);

    const sendMessage = (message: string) => {
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(message);
        } else {
            console.warn("WebSocket not open. Attempting to reconnect...");
            const ws = new WebSocket("ws://localhost:8080");
            ws.onopen = () => {
                ws.send(message);
                socketRef.current = ws;
                setSocket(ws);
                console.log("Reconnected and message sent");
            };
            ws.onerror = (error) => {
                console.error("Reconnection failed:", error);
            };
        }
    };

    return (
        <SocketContext.Provider value={{ socket, sendMessage }}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = (): SocketContextType => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error("useSocket must be used within a SocketProvider");
    }
    return context;
};