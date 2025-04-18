import amqp,{Channel, ChannelModel} from 'amqplib';
export class RabbitMqClient{
    private static instance: RabbitMqClient;
    private connection: ChannelModel|null = null;
    private channel:Channel|null = null;
    private connectionUrl: string;
    private queue: string = 'problems';
    private connecting: boolean = false;
    private reconnectTimeout: NodeJS.Timeout|null = null;

    private constructor(connectionUrl: string = 'amqp://localhost') {
        this.connectionUrl = connectionUrl;
    }
    public static getInstance(connUrl?:string): RabbitMqClient {
        if (!RabbitMqClient.instance) {
            RabbitMqClient.instance = new RabbitMqClient(connUrl);
        }
        return RabbitMqClient.instance;
    }

    public async getChannel(): Promise<Channel> {
        if(!this.channel){
            await this.connect()
        }
        if(!this.channel){
            throw new Error('Channel is not available');
        }
        return this.channel;
    }
    public async connect(): Promise<void> {
        if (this.connection || this.connecting) {
            return;
        }
        this.connecting = true;
       try {
            if(this.reconnectTimeout){
                clearTimeout(this.reconnectTimeout);
                this.reconnectTimeout = null;
            }
            this.connection = await amqp.connect(this.connectionUrl) 
            this.channel = await this.connection.createChannel() ;
            this.connection.on('error', this.handleConnectionError.bind(this));
            this.channel.on('error', this.handleChannelError.bind(this));
            this.connection.on('close', this.handleConnectionClose.bind(this));

            await this.channel.assertQueue(this.queue, {durable: true});
            console.log('RabbitMQ connected');
            this.connecting = false;
        } catch (error) {
            console.error('RabbitMQ connection error:', error);
            this.connecting = false;
            this.scheduleReconnect();
       }
    }

    private handleConnectionError(error: Error): void {
        console.error('RabbitMQ connection error:', error);
        this.scheduleReconnect();
      }
    
      private handleChannelError(error: Error): void {
        console.error('RabbitMQ channel error:', error);
        this.channel = null;
      }
    
      private handleConnectionClose(): void {
        console.log('RabbitMQ connection closed');
        this.connection = null;
        this.channel = null;
        this.scheduleReconnect();
      }

      private scheduleReconnect(): void {
        if (!this.reconnectTimeout) {
          console.log('Scheduling reconnection to RabbitMQ...');
          this.reconnectTimeout = setTimeout(() => {
            this.connect();
          }, 5000); 
        }
      }
      public async sendToQueue(message: string|object): Promise<void> {
        try {
            const msgString = typeof message === 'string' ? message : JSON.stringify(message);
            const channel = await this.getChannel();
            if (!channel) {
                throw new Error('Channel is not available');
            }
            channel.sendToQueue(this.queue, Buffer.from(msgString), {
                persistent: true,
            });
            console.log('Message sent to RabbitMQ:', msgString);
        } catch (error) {
            console.error('Error sending message to RabbitMQ:', error);
            
        }
      }
      public async close(): Promise<void> {
        if (this.channel) {
          await this.channel.close();
          this.channel = null;
        }
        if (this.connection) {
          await this.connection.close();
          this.connection = null;
        }
        if (this.reconnectTimeout) {
          clearTimeout(this.reconnectTimeout);
          this.reconnectTimeout = null;
        }
        console.log('RabbitMQ connection closed');
      }
    

}