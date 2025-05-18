import amqp, { Channel } from "amqplib";

import Docker from "dockerode";
import { createClient } from "redis";
import dotenv from "dotenv";
import fs from "fs";
import { s3 } from "./aws";
dotenv.config();

const docker = new Docker();

const TIMEOUT = 5000;

const client = createClient();

const connectRabbitMq = async () => {
  const connection = await amqp.connect("amqp://localhost");
  const channel = await connection.createChannel();
  await channel.assertQueue("problems", { durable: true });
  return channel;
}

const getImageForLanguage = (language: string) => {
  const images: Record<string, string> = {
    JAVASCRIPT: "node",
    PYTHON: "python",
  };
  return images[language];
};

const getFileExtensionForLanguage = (language: string) => {
  const extensions: Record<string, string> = {
    JAVASCRIPT: "js",
    PYTHON: "py",
  };
  return extensions[language];
};

const getCommandForLanguage = (language: string) => {
  const commands: Record<string, string> = {
    JAVASCRIPT: "node",
    PYTHON: "python",
  };
  return commands[language];
};

async function compareResults(problemId: number, userId: number,submissionId:number, results: any) {
  const file = await s3
    .getObject({
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: `problems/${problemId}/output.txt`,
    })
    .promise();

  const outputs = file.Body?.toString().split("\n") || [];
  const finalResults = outputs.map((output:any, index:number) => ({
    input: results[index],
    output: output.trim(),
  }));

  const status = finalResults.every(
    (result:any) => result.input == result.output
  )
    ? "ACCEPTED"
    : "WRONG_ANSWER";

    console.log("Final Results:", finalResults);

  client.publish(
    `results-${problemId}`,
    JSON.stringify({ problemId, status, results: finalResults,submissionId})
  );
}

async function processSubmission(submission: string) {
  const { problemId, userId, code, language,submissionId } = JSON.parse(submission);
  console.log(`Processing submission for problem ${problemId} by user ${userId} in language ${language}`);
  const image = getImageForLanguage(language);
  const extension = getFileExtensionForLanguage(language);
  const command = getCommandForLanguage(language);

  const codeDir = `/tmp/code-${problemId}`;
  if (!fs.existsSync(codeDir)) {
    fs.mkdirSync(codeDir);
  }
  fs.writeFileSync(`${codeDir}/code.${extension}`, code);

  const container = await docker.createContainer({
    Image: image,
    Tty: true,
    HostConfig: {
      Binds: [`${codeDir}:/code`],
      Memory: 512 * 1024 * 1024,
    },
    Cmd: [command, `/code/code.${extension}`],
    Volumes: {
      [codeDir]: {},
    },
  });

  let timeout: NodeJS.Timeout | null = null;

  try {
    await container.start();

    const stream = await container.logs({
      follow: true,
      stdout: true,
      stderr: true,
    });

    let output_chunks: string[] = [];

    stream.on("data", (chunk) => {
      output_chunks.push(chunk.toString());
    });

    const timeoutPromise = new Promise((_, reject) => {
      timeout = setTimeout(async () => {
        await container.kill();
        reject(new Error("Timeout"));
      }, TIMEOUT);
    });

    const containerPromise = container.wait();

    await Promise.race([timeoutPromise, containerPromise]);

    if (timeout) {
      clearTimeout(timeout);
    }

    const stdout = output_chunks.join("");
    const { StatusCode } = await container.wait();

    if (StatusCode !== 0) {
      console.error("Error occurred while running the container:", stdout);

      client.publish(
        `results-${problemId}`,
        JSON.stringify({
          submissionId,
          problemId,
          status: "RUNTIME_ERROR",
          results: stdout.trim(),
        })
      );
    } else {
      const lines = stdout.trim().split("\n");
      const finalResults = JSON.parse(lines[0]);
      await compareResults(problemId, userId,submissionId, finalResults);
    }
  } catch (error: any) {
    console.error("Error during container execution:", error.message);

    client.publish(
      `results-${problemId}`,
      JSON.stringify({
        submissionId,
        problemId,
        status: error.message === "Timeout" ? "TIME_LIMIT_EXCEEDED" : "RUNTIME_ERROR",
        results: error.message === "Timeout" ? "Your Program took too much time to run\nTry Optimizing the code a bit!" : error.message,
      })
    );
  } finally {
    if (timeout) clearTimeout(timeout);
    await container.remove().catch(console.error);
    fs.rmdirSync(codeDir, { recursive: true });
  }
}

async function startWorker() {
  try {
    await client.connect();
    const channel = await connectRabbitMq();
    console.log("Connected to RabbitMQ");
    channel.consume("problems", async (msg:any) => {
      if (msg) {
        try {
          
          const submission = msg.content.toString();
          await processSubmission(submission);
          channel.ack(msg);
        } catch (error) {
          console.error("Error processing message:", error);
          channel.nack(msg, false, false); // Reject the message and do not requeue
        }
      }
    });
  } catch (error) {
    console.error(error);
  }
}

startWorker();
