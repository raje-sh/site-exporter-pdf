import fs from "fs";
import { env } from "./lib/env";
import path from "path";
import {
  mergePDFs,
  launchBrowserAndTakeSnapshot,
  cleanOutputDirectoryExcept,
} from "./lib";

const getFullURI = (path: string) => `${env.SITE_BASE_URL}/${path}`;
const createOutputDirectoryIfNotExists = () => {
  if (!fs.existsSync(env.OUTPUT_DIR)) {
    fs.mkdirSync(env.OUTPUT_DIR);
  }
};

(async () => {
  createOutputDirectoryIfNotExists();
  const links = env.PAGE_LINKS.split(",").map(getFullURI);
  const result = await launchBrowserAndTakeSnapshot(links);
  if (env.OUTPUT_PDF_TYPE === "single") {
    const resultFileName = `result_${Date.now()}.pdf`;
    await mergePDFs(
      result.chunks.map((it) => path.resolve(env.OUTPUT_DIR, it)),
      path.join(env.OUTPUT_DIR, resultFileName)
    );
    cleanOutputDirectoryExcept([resultFileName]);
  } else {
    cleanOutputDirectoryExcept(result.chunks);
  }
  console.log("Export Done");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
