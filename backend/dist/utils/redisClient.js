"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const redis_1 = require("redis");
class SingletonRedisClient {
    constructor() {
        this.client = (0, redis_1.createClient)();
    }
    static getInstance() {
        if (!SingletonRedisClient.instance) {
            SingletonRedisClient.instance = new SingletonRedisClient();
        }
        return SingletonRedisClient.instance;
    }
    getClient() {
        return this.client;
    }
}
exports.default = SingletonRedisClient;
