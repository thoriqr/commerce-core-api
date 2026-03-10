import { appQueue } from "@/queues/app.queue";

async function run() {
  await appQueue.add("test-job", {
    hello: "world"
  });

  console.log("Job added");
  process.exit(0);
}

run();
