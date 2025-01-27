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
const docker = new dockerode_1.default();
// const TIMEOUT = 5000;
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
function processSubmission(submission) {
    return __awaiter(this, void 0, void 0, function* () {
        const { problemId, userId, code, language } = JSON.parse(submission);
        const image = getImageForLanguage(language);
        const extension = getFileExtensionForLanguage(language);
        const command = getCommandForLanguage(language);
        const codeDir = `/tmp/code-${problemId}`;
        // delete the directory if it exists
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
            Cmd: [command, "/code/code.js"],
            Volumes: {
                [codeDir]: {}
            },
        });
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
        const { StatusCode } = yield container.wait();
        const stdout = output_chunks.join("");
        if (StatusCode !== 0) {
            console.error("Error occurred while running the container:");
            console.log("stderror", stdout);
            yield container.remove();
            return;
            // throw new Error(`Container exited with status code ${StatusCode}`);
        }
        yield container.remove();
        // delete the directory
        fs_1.default.rmdirSync(codeDir, { recursive: true });
        const lines = stdout.trim().split("\n");
        try {
            const finalResults = JSON.parse(lines[lines.length - 1]);
            console.log(finalResults);
        }
        catch (error) {
            // this means that user code has some error
            console.log("Error", error);
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
