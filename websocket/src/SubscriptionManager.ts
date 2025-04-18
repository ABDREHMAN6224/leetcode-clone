import { createClient, RedisClientType } from "redis";
import { UserManager } from "./userManager";

export class SubscriptionManager {
    private static instance: SubscriptionManager;
    private subscriptions: Map<string, string[]> = new Map();
    private reverseSubscriptions: Map<string,string[]> = new Map();
    private redisClient:RedisClientType;

    private constructor() {
        this.redisClient=createClient();
        this.redisClient.connect();
    }
    
    public static getInstance(){
        if(!this.instance){
            this.instance = new SubscriptionManager();
        }
        return this.instance;
    }

    public subscribe(user:string,subscription:string){
        if(this.subscriptions.get(user)?.includes(subscription)) return
        this.subscriptions.set(user,(this.subscriptions.get(user)||[]).concat(subscription))
        this.reverseSubscriptions.set(subscription,(this.reverseSubscriptions.get(subscription)||[]).concat(user))
        console.log(this.reverseSubscriptions,this.subscriptions);
        if (this.reverseSubscriptions.get(subscription)?.length === 1) {
            this.redisClient.subscribe(subscription, this.redisCallbackHandler);
        }
    }
    private redisCallbackHandler = (message: string, channel: string) => {
        const parsedMessage = JSON.parse(message);
        this.reverseSubscriptions.get(channel)?.forEach(s => UserManager.getInstance().getUser(s)?.emit(channel,parsedMessage));
    }

    public unsubscribe(user:string,subscription:string){
        const subscriptions = this.subscriptions.get(user);
        if(subscriptions){
            this.subscriptions.set(user, subscriptions.filter(s => s !== subscription));
        }
        const reverseSubscriptions = this.reverseSubscriptions.get(subscription);
        if (reverseSubscriptions) {
            this.reverseSubscriptions.set(subscription, reverseSubscriptions.filter(s => s !== user));
            if (this.reverseSubscriptions.get(subscription)?.length === 0) {
                this.reverseSubscriptions.delete(subscription);
                this.redisClient.unsubscribe(subscription);
            }

        }
    }
    public userLeft(userId: string) {
        console.log("user left " + userId);
        this.subscriptions.get(userId)?.forEach(s => this.unsubscribe(userId, s));
    }
    
    getSubscriptions(userId: string) {
        return this.subscriptions.get(userId) || [];
    }
}