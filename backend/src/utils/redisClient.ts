import { createClient, RedisClientType } from "redis";

class SingletonRedisClient{
    private static instance: SingletonRedisClient;
    private client: any;

    private constructor(){
        this.client = createClient();
    }

    public static getInstance(): SingletonRedisClient{
        if(!SingletonRedisClient.instance){
            SingletonRedisClient.instance = new SingletonRedisClient();
        }
        return SingletonRedisClient.instance;
    }

    public getClient(): RedisClientType{
        return this.client;
    }
}

export default SingletonRedisClient;