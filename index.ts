import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";
import { setTimeout } from "node:timers/promises";
import recorder from "./lib/recorder";

const { TOKEN, DISABLE_RECORDING, BASE_URL } = process.env;

const LAST_OUT_REPORT_PATH = path.resolve(__dirname, "./in/last-out.gen.json");
const OUTPUT_DIR = path.resolve(__dirname, "./out");
const SRC_SITEMAP_PATH = path.resolve(__dirname, "./in/file.json");

type SiteMap = Array<{
  title: string;
  localeCode: string;
  path: string;
  updatedAt: string;
}>;

const genPath = (locale: string, path: string) => {
  if (!locale && !path) {
    return BASE_URL;
  }
  return `${BASE_URL}/${locale}/${path}`;
};

const outCache = () => {
  let lastOutResult = {};
  if (fs.existsSync(LAST_OUT_REPORT_PATH)) {
    lastOutResult = JSON.parse(fs.readFileSync(LAST_OUT_REPORT_PATH, "utf8"));
  }
  return {
    isNewWriteNeeded: (path: string, updatedAt: string) => {
      return lastOutResult[path] ? lastOutResult[path] !== updatedAt : true;
    },
    writeNewCache: (data: any) => {
      fs.writeFileSync(LAST_OUT_REPORT_PATH, JSON.stringify(data));
    },
    cleanUpOutDirectorOfNonExistentPages: (sitemap: SiteMap) => {
      const sitmapTitles = sitemap.map((it) => it.title);
      const files = fs.readdirSync(OUTPUT_DIR);
      const filesNotInSitemap = files.filter(
        (it) => !sitmapTitles.includes(it.replace(".pdf", ""))
      );
      if (filesNotInSitemap.length) {
        filesNotInSitemap.forEach((it) => {
          const filePath = path.join(OUTPUT_DIR, it);
          fs.unlinkSync(filePath);
        });
        console.log("Deleted Files: ", filesNotInSitemap.join(", "));
      }
    },
  };
};

const input = JSON.parse(fs.readFileSync(SRC_SITEMAP_PATH, "utf8")).map(
  (it: SiteMap[0]) =>
    ({
      ...it,
      path: genPath(it.localeCode, it.path),
    } as SiteMap[0])
) as SiteMap;

(async () => {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR);
  }
  const {
    isNewWriteNeeded,
    writeNewCache,
    cleanUpOutDirectorOfNonExistentPages,
  } = outCache();
  const linksRequireBackup = input.filter((it) =>
    isNewWriteNeeded(it.path, it.updatedAt)
  );
  if (linksRequireBackup.length) {
    const browser = await puppeteer.launch({
      headless: false /* , slwoMo: 2000 */,
    });
    const page = await browser.newPage();
    page.setCookie({
      name: "jwt",
      value: TOKEN,
      domain: BASE_URL.split("://")[1].replace(/\/$/, ""),
    });
    const timeout = 5000;
    page.setDefaultTimeout(timeout);
    await page.setViewport({
      width: 1260,
      height: 968,
    });
    for (const { path: pagePath, title } of linksRequireBackup) {
      try {
        console.log(`process: "${title}"`);
        await page.goto(pagePath, { waitUntil: "networkidle2" });
        await page.addStyleTag({
          content:
            "nav.v-navigation-drawer{display: none;} main.v-main{padding: 0 !important;}",
        });
        await setTimeout(1000);
        if (!Boolean(DISABLE_RECORDING)) {
          await recorder.record(page, path.join(OUTPUT_DIR, `${title}.mp4`));
        }
        await page.pdf({
          path: path.join(OUTPUT_DIR, `${title}.pdf`),
          format: "A4",
        });
      } catch (e) {
        console.warn(`error: "${title}" (${pagePath})`);
        console.error(e);
      }
    }
    writeNewCache(
      input.reduce((prev, it) => ({ ...prev, [it.path]: it.updatedAt }), {})
    );
    await browser.close();
  }
  cleanUpOutDirectorOfNonExistentPages(input);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
