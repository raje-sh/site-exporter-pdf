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
  // TODO: filepath, url or string_content
  files: string[]
) => {
  const urlRegex = /\b(?:https?|ftp):\/\/[^\s/$.?#].[^\s]*\b/g;
  // const unixPathRegex = /^(\/|\.\/|\.\.\/|~\/)?([^\/\0]+(\/)?)+$/;
  const getTagOptions = (
    asset: string,
    tagOptions: FrameAddScriptTagOptions | FrameAddStyleTagOptions
  ) => {
    // TODO: Optimize
    if (urlRegex.test(asset)) {
      tagOptions = { ...tagOptions, url: asset };
    } else if (fs.existsSync(asset)) {
      const fileContent = fs.readFileSync(asset, "utf-8");
      tagOptions = { ...tagOptions, content: fileContent };
    } else {
      // console.warn("injection error: file not found", asset);
      tagOptions = { ...tagOptions, content: asset };
    }
    return tagOptions;
  };
  for (const asset of files) {
    switch (type) {
      case "script":
        await page.addScriptTag(getTagOptions(asset, {}));
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
    // slowMo: 500,
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
      if (config.browser.inject.js?.length) {
        await injectAssets(page, "script", config.browser.inject.js);
      }
      if (config.browser.inject.css?.length) {
        await injectAssets(page, "style", config.browser.inject.css);
      }
      const pageTitle = await page.evaluate(() =>
        document.title.substring(0, document.title.lastIndexOf("|")).trim()
      );
      await setTimeout(config.browser.inject.load_delay);
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
