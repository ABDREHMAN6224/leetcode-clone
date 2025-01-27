import { createClient,} from "redis";
import Docker from "dockerode";
import fs from "fs";

const docker = new Docker();

// const TIMEOUT = 5000;

const client = createClient();

const getImageForLanguage = (language: string) => {
    const images: Record<string, string> = {
        JAVASCRIPT: "node",
        PYTHON: "python",
    };
    return images[language];
}

const getFileExtensionForLanguage = (language: string) => {
    const extensions: Record<string, string> = {
        JAVASCRIPT: "js",
        PYTHON: "py",
    };
    return extensions[language];
}

const getCommandForLanguage = (language: string) => {
    const commands: Record<string, string> = {
        JAVASCRIPT: "node",
        PYTHON: "python",
    };
    return commands[language];
}

async function processSubmission(submission: string) {
    const { problemId,userId, code, language } = JSON.parse(submission);
    const image = getImageForLanguage(language);
    const extension = getFileExtensionForLanguage(language);
    const command = getCommandForLanguage(language);


    const codeDir = `/tmp/code-${problemId}`;
    // delete the directory if it exists
    if(!fs.existsSync(codeDir)){
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
        Cmd: [command, "/code/code.js"],
        Volumes: {
            [codeDir]: {}
        },

    });
    await container.start();

    
    
    
    const stream = await container.logs({
        follow: true,
        stdout: true,
        stderr: true,
    });
    
    let output_chunks:string[] = [];
    
    stream.on("data", (chunk) => {
        output_chunks.push(chunk.toString());
    });
  

    const {StatusCode}=await container.wait();

    const stdout = output_chunks.join("");
    
    if (StatusCode !== 0) {
        console.error("Error occurred while running the container:");
        console.log("stderror", stdout);
        await container.remove();
        return ;
        // throw new Error(`Container exited with status code ${StatusCode}`);
    }
    

    await container.remove();
    // delete the directory
    fs.rmdirSync(codeDir, { recursive: true });

    const lines = stdout.trim().split("\n");
    try {
        const finalResults = JSON.parse(lines[lines.length - 1]);
        console.log(finalResults);
    } catch (error) {
        // this means that user code has some error
        console.log("Error", error);
    }

    





}





async function startWorker(){
    try {
        await client.connect();
        
        while(true){
            try {
                const submission = await client.brPop("submissions", 0);
                if(!submission){
                    continue;
                }
                
                await processSubmission(submission.element);
            } catch (error) {
                console.log(error)
            }
        }

    } catch (error) {
        console.error(error);
    }
}

startWorker();