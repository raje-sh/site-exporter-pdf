import "dotenv/config";
import fs from "fs";
import path from "path";
import {
  mergePDFs,
  launchBrowserAndTakeSnapshot,
  cleanOutputDirectoryExcept,
  parseConfig,
  env,
  debug
} from "./lib";
import { URL } from 'url'
import { error } from "console";
import { withTiming } from "./lib/util";


const getFullURI = (base_url: string, path: string) => (new URL(path, base_url)).toString();
const createDirectoryIfNotExists = (directory: string) => {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory);
    debug(`Created output directory: ${directory}`);
  } else {
    cleanOutputDirectoryExcept([], directory);
    debug(`removed all files in output directory: ${directory}`);
  }
};

(async () => {
  await withTiming(async () => {
    debug('Starting site-exporter')
    if (env.isDev) { console.time("export"); }
    const config = await parseConfig(env.CONFIG_FILE);
    createDirectoryIfNotExists(config.output.dir);
    const links = config.site.links.map((it) => getFullURI(config.site.baseUrl, it));
    const result = await launchBrowserAndTakeSnapshot(links, config);
    if (config.output.type === "single") {
      const resultFileName = config.output.filename!!.concat(".pdf");
      await mergePDFs(
        links
          .map((it) => result[it])
          .filter((it) => it !== undefined)
          .map((it) => path.resolve(config.output.dir, it)),
        path.join(config.output.dir, resultFileName)
      );
      debug('merged all files into one single file: %s', resultFileName);
      cleanOutputDirectoryExcept([resultFileName], config.output.dir);
    }
    if (env.isDev) { console.timeEnd("export"); }
    debug("Export Done");
  })
})().catch((err) => {
  error(err);
  process.exit(1);
});
