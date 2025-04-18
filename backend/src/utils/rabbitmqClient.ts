import amqp from 'amqplib';

export class RabbitMqClientSingleton {
  private static instance: RabbitMqClientSingleton;
  private channel: any;
    private connection: any;

  private constructor() {
    this.channel = null;
    this.initRabbitMqClient();
    this.connection = null;
  }

    private async initRabbitMqClient() {
        this.connection = await amqp.connect('amqp://localhost');
        this.channel = await this.connection.createChannel();
        await this.channel.assertQueue('problems', { durable: true });

    }

  public static getInstance(): RabbitMqClientSingleton {
    if (!RabbitMqClientSingleton.instance) {
      RabbitMqClientSingleton.instance = new RabbitMqClientSingleton();
    }
    return RabbitMqClientSingleton.instance;
  }

  public getChannel() {
    return this.channel;
  }

  public async sendToQueue(queue: string, message: string) {
    if (!this.channel) {
      throw new Error('Channel not initialized');
    }
    this.channel.sendToQueue(queue, Buffer.from(message), { persistent: true });
    console.log(`Message sent to queue ${queue}: ${message}`);
    setTimeout(() => {
        this.channel.close();
        console.log('Channel closed');
    }, 5000);
  }

}