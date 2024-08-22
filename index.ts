import "dotenv/config";
import fs from "fs";
import path from "path";
import {
  mergePDFs,
  launchBrowserAndTakeSnapshot,
  cleanOutputDirectoryExcept,
  parseConfig,
  AppConfig,
} from "./lib";

const getFullURI = (path: string, config: AppConfig) =>
  `${config.site.base_url}/${path}`;
const createDirectoryIfNotExists = (directory: string) => {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory);
  } else {
    cleanOutputDirectoryExcept([], directory);
  }
};

(async () => {
  const config = await parseConfig();
  createDirectoryIfNotExists(config.output.dir);
  const links = config.site.links.map((it) => getFullURI(it, config));
  console.time("scrap");
  const result = await launchBrowserAndTakeSnapshot(links, config);
  console.timeEnd("scrap");
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
  console.log("Export Done");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
