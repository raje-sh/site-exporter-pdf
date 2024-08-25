import { cleanEnv, str } from "envalid";

export const env = cleanEnv(process.env, {
  CONFIG_FILE: str({
    desc: "yaml config file path",
    default: "./config.yml",
    example: "/usr/app/config.yml",
  }),
  NODE_ENV: str({
    choices: ["development", "test", "production"],
    default: "production",
  }),
});
