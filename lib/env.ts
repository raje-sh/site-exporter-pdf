import { bool, cleanEnv, num, str } from "envalid";
import path from "path";

export const env = cleanEnv(process.env, {
  SITE_COOKIES: str({
    desc: "WikiJS Cookies",
    example: "domain=jwt-token;cookie1=value1;",
    default: undefined,
  }),
  SITE_BASE_URL: str({ desc: "WikiJS base URL", example: "http://localhost" }),
  NODE_ENV: str({
    choices: ["development", "test", "production"],
    default: "production",
  }),
  PAGE_LINKS: str({
    desc: "Comma Sperated page relative Paths",
    example: "en/page-1,ja/page-1",
  }),
  HEADLESS_MODE: bool({ default: true }),
  OUTPUT_DIR: str({
    default: path.resolve(__dirname, "../out"),
    desc: "Absolute Path of the Output Directory",
  }),
  WIKIJS_HIDE_SIDEBAR: bool({ default: true }),
  WIKIJS_PAGE_LOAD_TIME: num({ default: 1 * 1000 }),
  OUTPUT_PDF_TYPE: str({
    choices: ["single", "separate"],
    default: "single",
  }),
  PUPPETEER_PAGE_TIMEOUT: num({ default: 30 * 1000 }),
  PUPPETEER_VP_WIDTH: num({ default: 1260 }),
  PUPPETEER_VP_HEIGHT: num({ default: 968 }),
});
