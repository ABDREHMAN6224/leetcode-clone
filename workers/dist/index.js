"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const redis_1 = require("redis");
const dockerode_1 = __importDefault(require("dockerode"));
const fs_1 = __importDefault(require("fs"));
const aws_1 = require("./aws");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const docker = new dockerode_1.default();
const TIMEOUT = 5000;
const client = (0, redis_1.createClient)();
const getImageForLanguage = (language) => {
    const images = {
        JAVASCRIPT: "node",
        PYTHON: "python",
    };
    return images[language];
};
const getFileExtensionForLanguage = (language) => {
    const extensions = {
        JAVASCRIPT: "js",
        PYTHON: "py",
    };
    return extensions[language];
};
const getCommandForLanguage = (language) => {
    const commands = {
        JAVASCRIPT: "node",
        PYTHON: "python",
    };
    return commands[language];
};
function compareResults(problemId, userId, results) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const file = yield aws_1.s3
            .getObject({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: `problems/${problemId}/output.txt`,
        })
            .promise();
        const outputs = ((_a = file.Body) === null || _a === void 0 ? void 0 : _a.toString().split("\n")) || [];
        const finalResults = outputs.map((output, index) => ({
            input: results[index],
            output: output.trim(),
        }));
        const status = finalResults.every((result) => result.input == result.output)
            ? "accepted"
            : "wrong answer";
        console.log("Final Results:", finalResults);
        client.publish(`results-${userId}`, JSON.stringify({ problemId, status, results: finalResults }));
    });
}
function processSubmission(submission) {
    return __awaiter(this, void 0, void 0, function* () {
        const { problemId, userId, code, language } = JSON.parse(submission);
        const image = getImageForLanguage(language);
        const extension = getFileExtensionForLanguage(language);
        const command = getCommandForLanguage(language);
        const codeDir = `/tmp/code-${problemId}`;
        if (!fs_1.default.existsSync(codeDir)) {
            fs_1.default.mkdirSync(codeDir);
        }
        fs_1.default.writeFileSync(`${codeDir}/code.${extension}`, code);
        const container = yield docker.createContainer({
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
        let timeout = null;
        try {
            yield container.start();
            const stream = yield container.logs({
                follow: true,
                stdout: true,
                stderr: true,
            });
            let output_chunks = [];
            stream.on("data", (chunk) => {
                output_chunks.push(chunk.toString());
            });
            const timeoutPromise = new Promise((_, reject) => {
                timeout = setTimeout(() => __awaiter(this, void 0, void 0, function* () {
                    yield container.kill();
                    reject(new Error("Timeout"));
                }), TIMEOUT);
            });
            const containerPromise = container.wait();
            yield Promise.race([timeoutPromise, containerPromise]);
            if (timeout) {
                clearTimeout(timeout);
            }
            const stdout = output_chunks.join("");
            const { StatusCode } = yield container.wait();
            if (StatusCode !== 0) {
                console.error("Error occurred while running the container:", stdout);
                client.publish(`results-${userId}`, JSON.stringify({
                    problemId,
                    status: "error",
                    results: stdout.trim(),
                }));
            }
            else {
                const lines = stdout.trim().split("\n");
                const finalResults = JSON.parse(lines[0]);
                yield compareResults(problemId, userId, finalResults);
            }
        }
        catch (error) {
            console.error("Error during container execution:", error.message);
            client.publish(`results-${userId}`, JSON.stringify({
                problemId,
                status: error.message === "Timeout" ? "TLE" : "error",
                results: error.message,
            }));
        }
        finally {
            if (timeout)
                clearTimeout(timeout);
            yield container.remove().catch(console.error);
            fs_1.default.rmdirSync(codeDir, { recursive: true });
        }
    });
}
function startWorker() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield client.connect();
            while (true) {
                try {
                    const submission = yield client.brPop("submissions", 0);
                    if (!submission) {
                        continue;
                    }
                    yield processSubmission(submission.element);
                }
                catch (error) {
                    console.log(error);
                }
            }
        }
        catch (error) {
            console.error(error);
        }
    });
}
startWorker();
