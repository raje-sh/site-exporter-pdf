import { cleanEnv, str } from "envalid";

export const env = cleanEnv(process.env, {
  SITE_COOKIES: str({
    desc: "Site Cookies",
    example: "domain=jwt-token;cookie1=value1;",
    default: undefined,
  }),
  CONFIG_FILE_PATH: str({
    desc: "yaml config file path",
    default: "./config.yml",
    example: "/usr/app/config.yml",
  }),
  NODE_ENV: str({
    choices: ["development", "test", "production"],
    default: "production",
  }),
});
