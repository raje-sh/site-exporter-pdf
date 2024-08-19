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
  } else {
    cleanOutputDirectoryExcept([]);
  }
};

(async () => {
  createOutputDirectoryIfNotExists();
  const links = env.PAGE_LINKS.split(",").map(getFullURI);
  const result = await launchBrowserAndTakeSnapshot(links);
  if (env.OUTPUT_PDF_TYPE === "single") {
    const resultFileName = env.OUTPUT_FILE_NAME.concat(".pdf");
    await mergePDFs(
      result.chunks.map((it) => path.resolve(env.OUTPUT_DIR, it)),
      path.join(env.OUTPUT_DIR, resultFileName)
    );
    cleanOutputDirectoryExcept([resultFileName]);
  }
  console.log("Export Done");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
