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
import { loadHooks } from "./lib/hooks";


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

    const hooks = await loadHooks(config.hooks)
    console.log("🚀 ~ awaitwithTiming ~ hooks:", hooks)
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    hooks.onConfigParsingComplete && hooks.onConfigParsingComplete({
      site: {
        baseUrl: 'https://example.com'
      }
    });
    
    createDirectoryIfNotExists(config.output.dir);
    const links = config.site.links.map((it) => getFullURI(config.site.baseUrl, it));
    const result = await launchBrowserAndTakeSnapshot(links, config);
    const [failedLinks, succeededLinks] = links.reduce(
      ([failed, succeeded], it) => 
        result[it] === undefined 
          ? [[...failed, it], succeeded]
          : [failed, [...succeeded, it]],
      [[], []] as [string[], string[]]
    );

    if (config.output.type === "single") {
      const resultFileName = config.output.filename!!.concat(".pdf");
      await mergePDFs(
        succeededLinks
          .map((it) => path.resolve(config.output.dir, result[it].tmpId)),
        path.join(config.output.dir, resultFileName)
      );
      debug('merged all files into one single file: %s', resultFileName);
      cleanOutputDirectoryExcept([resultFileName], config.output.dir);
    } else if(config.output.type === 'separate') {
      succeededLinks.forEach(it => {
        const outInfo = result[it];
        const oldPath = path.join(config.output.dir, outInfo.tmpId);
        const newPath = path.join(config.output.dir, outInfo.fileName.concat('.pdf'));
        fs.renameSync(oldPath, newPath);
      });
    }
    if(failedLinks.length) {
      // TODO: check if this is ever printed. currently, even 404 links also not reaching this line.
      error(`unable to process these following links: %s`, failedLinks.join(','))
    }
    if (env.isDev) { console.timeEnd("export"); }
    debug("Export Done");
  })
})().catch((err) => {
  error(err);
  process.exit(1);
});
