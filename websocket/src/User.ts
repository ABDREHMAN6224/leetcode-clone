import { WebSocket } from 'ws';
import { SubscriptionManager } from './SubscriptionManager';
const BACKEND_URL = "http://localhost:3000";

export class User {
    private id: string;
    private socket: WebSocket;

    constructor(id: string, socket: WebSocket) {
        this.id = id;
        this.socket = socket;
        this.addListeners();
    }

    emit(channel:string,message: any) {
                if(channel.startsWith("result")){
                    console.log("result",message);
                    // const {problemId,status,results,submissionId} = JSON.parse(message);

                    // fetch(`${BACKEND_URL}/api/submissions/${submissionId}`, {
                    //     method: "PUT",
                    //     headers: {
                    //         "Content-Type": "application/json",
                    //     },
                    //     body: JSON.stringify({status}),
                    // })
                    // this.socket.send(JSON.stringify({type: "results", payload: {problemId,status,results}}));
                }
                else{

                    this.socket.send(JSON.stringify(message));
                }
    }

    private addListeners() {
        this.socket.on('message', (message: string) => {
            const { type, payload } = JSON.parse(message);
            switch (type) {
                case 'subscribe':
                    SubscriptionManager.getInstance().subscribe(this.id,`results-${payload}`)
                    break;
                case 'unsubscribe':
                    SubscriptionManager.getInstance().unsubscribe(this.id,`results-${payload}`)
                    break;
                default:
                    break;
            }
        })
    }
}