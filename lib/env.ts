import { bool, cleanEnv, num, str } from "envalid";
import path from "path";

export const env = cleanEnv(process.env, {
  JWT_TOKEN: str({ desc: "WIKIJS JWT TOKEN", default: undefined }),
  SITE_BASE_URL: str({ desc: "WikiJS base URL", example: "http://localhost" }),
  NODE_ENV: str({
    choices: ["development", "test", "production"],
    default: "production",
  }),
  PAGE_LINKS: str({
    desc: "Comma Sperated page relative Paths",
    example: "en/page-1,ja/page-1",
  }),
  HEADLESS_MODE: bool({ desc: "Chrome Mode", default: false }),
  OUTPUT_DIR: str({
    default: path.resolve(__dirname, "../out"),
    desc: "Absolute Path of the Export Directory",
  }),
  WIKIJS_HIDE_SIDEBAR: bool({ default: true }),
  WIKIJS_PAGE_LOAD_TIME: num({ default: 1 * 1000 }),
  OUTPUT_PDF_TYPE: str({
    choices: ["single", "separate"],
    default: "single",
  }),
});
