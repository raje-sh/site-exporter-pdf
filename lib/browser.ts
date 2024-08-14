import path from "path";
import { env } from "./env";
import puppeteer from "puppeteer";
import { setTimeout } from "node:timers/promises";

export const launchBrowserAndTakeSnapshot = async (links: string[]) => {
  const pdfFileChunks: Array<string> = [];
  const browser = await puppeteer.launch({
    headless: env.HEADLESS_MODE,
    // args: ["--no-sandbox", "--disable-setuid-sandbox"],
    // executablePath: "/usr/bin/google-chrome",
  });
  const page = await browser.newPage();
  if (env.JWT_TOKEN) {
    page.setCookie({
      name: "jwt",
      value: env.JWT_TOKEN,
      domain: env.SITE_BASE_URL.split("://")[1].replace(/\/$/, ""),
    });
  }
  const timeout = 5000;
  page.setDefaultTimeout(timeout);
  await page.setViewport({
    width: 1260,
    height: 968,
  });
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
