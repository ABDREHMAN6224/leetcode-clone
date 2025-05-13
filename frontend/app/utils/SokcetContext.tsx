"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type SocketContextType = {
    socket: WebSocket | null;
    sendMessage: (message: string) => void;
};

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [socket, setSocket] = useState<WebSocket | null>(null);

    useEffect(() => {
        const ws = new WebSocket("ws://localhost:8080"); // Replace with your WebSocket server URL
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

      

        return () => {
            ws.close();
        };
    }, []);

    useEffect(() => {
        if (socket) {
            socket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                console.log("Message from server:", data);
            };
        }
    }
    , [socket]);

    const sendMessage = (message: string) => {
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(message);
        } else {
            console.error("WebSocket is not open");
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