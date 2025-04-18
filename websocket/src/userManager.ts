import WebSocket from 'ws';
import { User } from './User';
import { SubscriptionManager } from './SubscriptionManager';
export class UserManager {
    private users: Map<string, User> = new Map();
    private static instance: UserManager;

    private constructor() {}

    public static getInstance(): UserManager {
        if (!UserManager.instance) {
            UserManager.instance = new UserManager();
        }
        return UserManager.instance;
    }

    private getRandomId(): string {
        return Math.random().toString(36).substring(2, 15)+Math.random().toString(36).substring(2, 15);
    }

    public addUser(socket: WebSocket): User {
        const id = this.getRandomId();
        const user = new User(id, socket);
        this.users.set(id, user);
        console.log(`User ${id} connected`);
        
        this.registerOnClose(socket,id);
        return user;
    }
    private registerOnClose(socket: WebSocket, id:string) {
        socket.on('close', () => {
            this.users.delete(id);
            SubscriptionManager.getInstance().userLeft(id)
        })
    }

    public getUser(id: string): User | undefined {
        return this.users.get(id);
    }

}