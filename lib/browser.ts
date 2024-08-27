import path from "path";
import puppeteer, {
  Browser,
  FrameAddScriptTagOptions,
  FrameAddStyleTagOptions,
  Page,
} from "puppeteer";
import { setTimeout } from "node:timers/promises";
import fs from "fs";
import { AppConfig } from "./config";
import { env } from "./env";
import pLimit from "p-limit";
import { error, debug } from "./logger";

const setPageCookies = (page: Page, config: AppConfig) => {
  const cookieDomain = config.site.baseUrl.split("://")[1].replace(/\/$/, "");
  config.site.cookies.forEach((it) => {
    page.setCookie({
      name: it.key,
      value: it.value,
      domain: cookieDomain,
    });
  });
};

const injectAssets = async (
  page: Page,
  type: "script" | "style",
  files:
    | AppConfig["browser"]["inject"]["js"]
    | AppConfig["browser"]["inject"]["css"]
) => {
  const getTagOptions = (
    asset:
      | AppConfig["browser"]["inject"]["js"][0]
      | AppConfig["browser"]["inject"]["css"][0],
    tagOptions: FrameAddScriptTagOptions | FrameAddStyleTagOptions
  ) => {
    if (asset.url) {
      tagOptions = { ...tagOptions, url: asset.url };
    } else if (asset.file && fs.existsSync(asset.file)) {
      const fileContent = fs.readFileSync(asset.file, "utf-8");
      tagOptions = { ...tagOptions, content: fileContent };
    } else {
      tagOptions = { ...tagOptions, content: asset.content };
    }
    return tagOptions;
  };
  for (const asset of files) {
    switch (type) {
      case "script":
        // eslint-disable-next-line
        const evalScript = (asset as AppConfig["browser"]["inject"]["js"][0])
          .eval;
        if (evalScript) {
          await page.evaluate((script: string) => {
            eval(script);
          }, evalScript);
          debug('injecting eval script: %s', evalScript);
        } else {
          await page.addScriptTag(getTagOptions(asset, {}));
          debug('injecting script: %s', asset);
        }
        break;
      case "style":
        debug('injecting style: %s', asset);
        await page.addStyleTag(getTagOptions(asset, {}));
        break;
      default:
        error("unknown injection type: %s", type);
    }
  }
};

const withBrowser = async <Type>(fn: (browser: Browser) => Promise<Type>, config: AppConfig) => {
  const browser = await puppeteer.launch({
    headless: config.browser.headless,
    executablePath: env.isProd
      ? process.env.PUPPETEER_EXECUTABLE_PATH
      : puppeteer.executablePath(),
    ...(env.isDev
      ? { devtools: true, protocolTimeout: 60 * 60 * 1000, slowMo: 100 }
      : {}),
    ignoreDefaultArgs: ["--disable-extensions"],
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--no-zygote",
    ],
  });
  try {
    return await fn(browser);
  } finally {
    await browser.close();
  }
};

const withPage =
  <Type>(browser: Browser, config: AppConfig) => async (fn: (page: Page) => Promise<Type>) => {
    const page = await browser.newPage();
    setPageCookies(page, config);
    page.setDefaultTimeout(config.browser.pageTimeout);
    await page.setViewport({
      width: config.browser.viewport.width,
      height: config.browser.viewport.height,
    });
    try {
      return await fn(page);
    } finally {
      await page.close();
    }
  };

const getFileNameEvalScript = (config: AppConfig): string => {
  if (config.output.type === 'single') {
    return "encodeURIComponent(document.URL).replace(/%/g, '_')";
  }
  return config.output.filenameEval!!;
}

const processLink = async (
  link: string,
  config: AppConfig,
  browser: Browser,
  fileNameParserScript: string
) => {
  return await withPage<string | undefined>(
    browser,
    config
  )(async (page: Page) => {
    try {
      debug("processing: %s", link);
      await page.goto(link, {
        waitUntil: "networkidle2",
      });
      if (config.browser.inject.js.length) {
        await injectAssets(page, "script", config.browser.inject.js);
      }
      if (config.browser.inject.css?.length) {
        await injectAssets(page, "style", config.browser.inject.css);
      }
      const pageTitle = await page.evaluate((script) =>
        eval(script), fileNameParserScript
      );
      debug('evaluated page title: "%s" and wait for asset to load: %d ms', pageTitle, config.browser.inject.assetLoadWaitMs);
      await setTimeout(config.browser.inject.assetLoadWaitMs);
      const fileName = `${pageTitle}.pdf`;
      await page.pdf({
        path: path.join(config.output.dir, fileName),
        timeout: config.browser.pageTimeout,
        ...config.output.pdfOptions
      });
      return fileName;
    } catch (e) {
      error('failed processing: %s, error: %o', link, e);
    }
  });
};

export const launchBrowserAndTakeSnapshot = async (
  links: string[],
  config: AppConfig
) => {
  const parallelize = pLimit(config.concurrency);
  const pdfFileChunks: Record<string, string> = {};
  const fileNameParserScript = getFileNameEvalScript(config);
  return (await withBrowser(async (browser: Browser) => {
    const pushLink = async (link: string) => {
      const fileName = await processLink(link, config, browser, fileNameParserScript);
      if (fileName) {
        pdfFileChunks[link] = fileName;
        debug('processed: %s, output: %s', link, fileName);
      }
    };
    await Promise.all(links.map((it) => parallelize(() => pushLink(it))));
    debug('finsished processing all "%d" links', links.length);
    return pdfFileChunks;
  }, config)) as Record<string, string>;
};
