import {WebSocket,WebSocketServer} from "ws";
import { createClient } from "redis";


const subscriber = createClient();
const userToSocket = new Map<string, WebSocket>();

const wss = new WebSocketServer({ port: 8080 });

wss.on("connection",async (ws: WebSocket) => {
    await subscriber.connect();
  ws.on("message",  (message: string) => {
    const {type, payload} = JSON.parse(message);
    switch (type) {
        case "join":
            console.log("Joining user", payload);
            userToSocket.set(payload, ws);
            subscriber.subscribe(`results-${payload}`, (err, count) => {
                if (err) {
                  console.error(err);
                }
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

subscriber.on("message", (channel, message) => {
    console.log(channel, message);
    const data  = JSON.parse(message);
    console.log(data);
});

console.log("WebSocket server started at ws://localhost:8080");

