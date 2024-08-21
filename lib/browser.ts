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
const initPage = async (browser: Browser, config: AppConfig) => {
  const page = await browser.newPage();
  setPageCookies(page, config);
  page.setDefaultTimeout(config.browser.page_timeout);
  await page.setViewport({
    width: config.browser.viewport.width,
    height: config.browser.viewport.height,
  });
  return page;
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

export const launchBrowserAndTakeSnapshot = async (
  links: string[],
  config: AppConfig
) => {
  const pdfFileChunks: Array<string> = [];
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

  const page = await initPage(browser, config);
  for (const link of links) {
    try {
      console.log(`process: "${link}"`);
      await page.goto(link, {
        waitUntil: "networkidle2",
      });
      await page.waitForSelector(".tabset-content .tabset-panel");
      if (config.browser.inject.js.length) {
        await injectAssets(page, "script", config.browser.inject.js);
      }
      if (config.browser.inject.css?.length) {
        await injectAssets(page, "style", config.browser.inject.css);
      }
      const pageTitle = await page.evaluate(() =>
        document.title.substring(0, document.title.lastIndexOf("|")).trim()
      );

      await page.waitForNavigation({ waitUntil: "networkidle0" });
      await setTimeout(config.browser.inject.load_delay);
      // await page.evaluate(() => {
      //   debugger;
      // });
      const fileName = `${pageTitle}.pdf`;
      pdfFileChunks.push(fileName);
      await page.pdf({
        path: path.join(config.output.dir, fileName),
        format: "A4",
      });
    } catch (e) {
      console.warn(`error: "${link}"`);
      console.error(e);
    }
  }
  await browser.close();
  return {
    chunks: pdfFileChunks,
  };
};
