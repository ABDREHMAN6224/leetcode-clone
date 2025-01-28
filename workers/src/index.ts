import { createClient } from "redis";
import Docker from "dockerode";
import fs from "fs";
import { s3 } from "./aws";
import dotenv from "dotenv";
dotenv.config();

const docker = new Docker();

const TIMEOUT = 5000;

const client = createClient();

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
  const finalResults = outputs.map((output, index) => ({
    input: results[index],
    output: output.trim(),
  }));

  const status = finalResults.every(
    (result) => result.input == result.output
  )
    ? "ACCEPTED"
    : "WRONG_ANSWER";

    console.log("Final Results:", finalResults);

  client.publish(
    `results-${userId}`,
    JSON.stringify({ problemId, status, results: finalResults,submissionId})
  );
}

async function processSubmission(submission: string) {
  const { problemId, userId, code, language,submissionId } = JSON.parse(submission);
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
        `results-${userId}`,
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
      `results-${userId}`,
      JSON.stringify({
        submissionId,
        problemId,
        status: error.message === "Timeout" ? "TIME_LIMIT_EXCEEDED" : "RUNTIME_ERROR",
        results: error.message,
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

    while (true) {
      try {
        const submission = await client.brPop("submissions", 0);
        if (!submission) {
          continue;
        }

        await processSubmission(submission.element);
      } catch (error) {
        console.log(error);
      }
    }
  } catch (error) {
    console.error(error);
  }
}

startWorker();
