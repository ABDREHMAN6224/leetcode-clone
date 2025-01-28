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
            subscriber.subscribe(`results-${payload}`, (data, count) => {
                console.log("Subscribed to results", count);
                const {problemId,status,results} = JSON.parse(data);
                ws.send(JSON.stringify({type: "results", payload: {problemId,status,results}}));
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


