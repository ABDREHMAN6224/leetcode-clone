import {WebSocketServer} from "ws";
import { UserManager } from "./userManager";
import dotenv from "dotenv";
dotenv.config();




const wss = new WebSocketServer({ port: 8080 });

wss.on("connection", (ws) => {
    UserManager.getInstance().addUser(ws);
});



