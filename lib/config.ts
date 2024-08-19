import yaml from "js-yaml";
import fs from "fs";
import { env } from "./env";
import Joi from "joi";
export type AppConfig = {
  site: {
    base_url: string;
    links: Array<string>;
    cookies: Array<{ key: string; value: string }>;
  };
  browser: {
    headless: boolean;
    inject: {
      css: Array<string>;
      js: Array<string>;
      load_delay: number;
    };
    viewport: {
      width: number;
      height: number;
    };
    page_timeout: number;
  };
  output: {
    dir: string;
    type: "single" | "separate";
    filename: string;
  };
};

const readEnvCookies = () => {
  if (!env.SITE_COOKIES) return [];

  return env.SITE_COOKIES.split(";")
    .map((it) => it.trim())
    .filter((it) => it.length)
    .reduce<Array<{ key: string; value: string }>>((prev, curr) => {
      const [key, value] = curr.split("=");
      return [
        ...prev,
        {
          key,
          value,
        },
      ];
    }, []);
};

// relative & absolute
const pathRegex = /^(\/[^\/\0]*(\/[^\/\0]*)*|(\.\/|\.\.\/|[^\/].*))$/;
const configSchema = Joi.object({
  site: Joi.object({
    base_url: Joi.string()
      .uri({
        allowRelative: false,
        scheme: ["http", "https"],
      })
      .example("http://localhost:3000")
      .required(),
    cookies: Joi.array()
      .items(
        Joi.object({
          key: Joi.string().required(),
          value: Joi.string().required(),
        })
      )
      .default(readEnvCookies()),
    links: Joi.array()
      .items(Joi.string().uri({ relativeOnly: true }))
      .min(1)
      .required(),
  }).required(),
  browser: Joi.object({
    headless: Joi.bool().default(true),
    viewport: Joi.object({
      width: Joi.number().default(1260),
      height: Joi.number().default(968),
    }).default(),
    page_timeout: Joi.number().default(30 * 1000),
    inject: Joi.object({
      load_delay: Joi.number().default(1 * 1000),
      // TODO: path, url, content_string
      css: Joi.array().items(Joi.string()).default([]),
      js: Joi.array().items(Joi.string()).default([]),
    }).default(),
  }).default(),
  output: Joi.object({
    dir: Joi.string().regex(pathRegex).default("./out"),
    type: Joi.string().valid("single", "separate").default("single"),
    filename: Joi.string().default("result"),
  }).default(),
}).required();

export const parseConfig = (): AppConfig => {
  if (!fs.existsSync(env.CONFIG_FILE_PATH)) {
    throw new Error(`config file missing: ${env.CONFIG_FILE_PATH}`);
  }
  const doc = yaml.load(fs.readFileSync(env.CONFIG_FILE_PATH, "utf-8"));
  const { error, value } = configSchema.validate(doc, {
    abortEarly: false,
    stripUnknown: true,
  });
  if (error) {
    const errorMsg = error.details.map((it) => it.message).join("\n");
    throw new Error(errorMsg);
  }
  // console.log(JSON.stringify(value));
  return value;
};
