import fs from "fs";
import path from "path";

type JobHandler = (data?: unknown) => Promise<unknown>;

export const jobRegistry = new Map<string, JobHandler>();

const jobsDir = __dirname;

const files = fs.readdirSync(jobsDir).filter((file) => file.endsWith(".job.js") || file.endsWith(".job.ts"));

for (const file of files) {
  const jobModule = require(path.join(jobsDir, file));

  if (!jobModule.jobName || !jobModule.handler) {
    throw new Error(`Invalid job module: ${file}`);
  }

  jobRegistry.set(jobModule.jobName, jobModule.handler);
}

console.log("Registered jobs:", [...jobRegistry.keys()]);
