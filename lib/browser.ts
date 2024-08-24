import path from "path";
import puppeteer, {
  Browser,
  FrameAddScriptTagOptions,
  FrameAddStyleTagOptions,
  Page,
} from "puppeteer";
import { setTimeout } from "node:timers/promises";
import fs from "fs";
import { AppConfig, env } from "./config";
import pLimit from "p-limit";

const setPageCookies = (page: Page, config: AppConfig) => {
  const cookieDomain = config.site.base_url.split("://")[1].replace(/\/$/, "");
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
        const evalScript = (asset as AppConfig["browser"]["inject"]["js"][0])
          .eval;
        if (evalScript) {
          await page.evaluate((script: string) => {
            eval(script);
          }, evalScript);
        } else {
          await page.addScriptTag(getTagOptions(asset, {}));
        }
        break;
      case "style":
        await page.addStyleTag(getTagOptions(asset, {}));
        break;
      default:
        console.warn("unsupported injection");
    }
  }
};

const withBrowser = async (fn: Function, config: AppConfig) => {
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
      // "--single-process",
    ],
  });
  try {
    return await fn(browser);
  } finally {
    await browser.close();
  }
};

const withPage =
  (browser: Browser, config: AppConfig) => async (fn: Function) => {
    const page = await browser.newPage();
    setPageCookies(page, config);
    page.setDefaultTimeout(config.browser.page_timeout);
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

const getFileNameEvalScript = (config: AppConfig) : string => {
  if(config.output.type === 'single') {
    return "encodeURIComponent(document.URL).replace(/%/g, '_')";
  }
  return config.output.filenameEval;
}

const processLink = async (
  link: string,
  config: AppConfig,
  browser: Browser,
  fileNameParserScript: string
) => {
  return await withPage(
    browser,
    config
  )(async (page: Page) => {
    try {
      console.log(`process: "${link}"`);
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
        // document.title.substring(0, document.title.lastIndexOf("|")).trim()
      );
      await setTimeout(config.browser.inject.asset_load_wait_ms);
      // await page.evaluate(() => {
      //   debugger;
      // });
      const fileName = `${pageTitle}.pdf`;
      await page.pdf({
        path: path.join(config.output.dir, fileName),
        format: "A4",
        margin: {
          top: 20,
          bottom: 20,
          left: 20,
          right: 20,
        },
      });
      return fileName;
    } catch (e) {
      console.warn(`error: "${link}"`);
      console.error(e);
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
      }
    };
    await Promise.all(links.map((it) => parallelize(() => pushLink(it))));
    return pdfFileChunks;
  }, config)) as Record<string, string>;
};
