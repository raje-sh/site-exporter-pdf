import path from "path";
import { env } from "./env";
import puppeteer, { Browser, Page } from "puppeteer";
import { setTimeout } from "node:timers/promises";

const setPageCookies = (page: Page) => {
  if (!env.SITE_COOKIES) return;

  const cookies = env.SITE_COOKIES.split(";")
    .map((it) => it.trim())
    .filter((it) => it.length);
  const cookieDomain = env.SITE_BASE_URL.split("://")[1].replace(/\/$/, "");
  cookies.forEach((it) => {
    const [key, value] = it.split("=");
    page.setCookie({
      name: key,
      value: value,
      domain: cookieDomain,
    });
  });
};
const initPage = async (browser: Browser) => {
  const page = await browser.newPage();
  setPageCookies(page);
  page.setDefaultTimeout(env.PUPPETEER_PAGE_TIMEOUT);
  await page.setViewport({
    width: env.PUPPETEER_VP_WIDTH,
    height: env.PUPPETEER_VP_HEIGHT,
  });
  return page;
};

export const launchBrowserAndTakeSnapshot = async (links: string[]) => {
  const pdfFileChunks: Array<string> = [];
  const browser = await puppeteer.launch({
    headless: env.HEADLESS_MODE,
    executablePath: env.isProd
      ? process.env.PUPPETEER_EXECUTABLE_PATH
      : puppeteer.executablePath(),
    ignoreDefaultArgs: ["--disable-extensions"],
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--no-zygote",
      "--single-process",
    ],
  });

  const page = await initPage(browser);
  for (const link of links) {
    try {
      console.log(`process: "${link}"`);
      await page.goto(link, { waitUntil: "networkidle2" });
      if (env.WIKIJS_HIDE_SIDEBAR) {
        await page.addStyleTag({
          content:
            "nav.v-navigation-drawer{display: none;} main.v-main{padding: 0 !important;}",
        });
      }
      const pageTitle = await page.evaluate(() =>
        document.title.substring(0, document.title.lastIndexOf("|")).trim()
      );
      await setTimeout(env.WIKIJS_PAGE_LOAD_TIME);
      const fileName = `${pageTitle}.pdf`;
      pdfFileChunks.push(fileName);
      await page.pdf({
        path: path.join(env.OUTPUT_DIR, fileName),
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
