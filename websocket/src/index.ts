import {WebSocket,WebSocketServer} from "ws";
import { createClient } from "redis";

const BACKEND_URL = "http://localhost:3000";


const subscriber = createClient();
const userToSocket = new Map<string, WebSocket>();

const wss = new WebSocketServer({ port: 8080 });

wss.on("connection",async (ws: WebSocket) => {
    await subscriber.connect();
  ws.on("message",  (message: string) => {
    const {type, payload} = JSON.parse(message);
    switch (type) {
        case "join":
            userToSocket.set(payload, ws);
            subscriber.subscribe(`results-${payload}`, async(data, count) => {
                const {problemId,status,results,submissionId} = JSON.parse(data);
                ws.send(JSON.stringify({type: "results", payload: {problemId,status,results}}));
                const res = await fetch(`${BACKEND_URL}/api/submissions/${submissionId}`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({status}),
                })
            });
            break;
    
        default:
            break;
    }
    ws.send(`Received message => ${message}`);
  });

  ws.on("close", () => {
    userToSocket.forEach((client, user) => {
      if (client === ws) {
        userToSocket.delete(user);
      }
    });
  });
});


