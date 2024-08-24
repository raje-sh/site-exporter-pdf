import "dotenv/config";
import fs from "fs";
import path from "path";
import {
  mergePDFs,
  launchBrowserAndTakeSnapshot,
  cleanOutputDirectoryExcept,
  parseConfig,
  env
} from "./lib";
import { URL } from 'url'

const getFullURI = (base_url: string, path: string) => (new URL(path, base_url)).toString();
const createDirectoryIfNotExists = (directory: string) => {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory);
  } else {
    cleanOutputDirectoryExcept([], directory);
  }
};

(async () => {
  if (env.isDev) { console.time("export"); }
  const config = await parseConfig();
  createDirectoryIfNotExists(config.output.dir);
  const links = config.site.links.map((it) => getFullURI(config.site.base_url, it));
  const result = await launchBrowserAndTakeSnapshot(links, config);
  if (config.output.type === "single") {
    const resultFileName = config.output.filename.concat(".pdf");
    await mergePDFs(
      links
        .map((it) => result[it])
        .filter((it) => it !== undefined)
        .map((it) => path.resolve(config.output.dir, it)),
      path.join(config.output.dir, resultFileName)
    );
    cleanOutputDirectoryExcept([resultFileName], config.output.dir);
  }
  if (env.isDev) { console.timeEnd("export"); }
  console.log("Export Done");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
