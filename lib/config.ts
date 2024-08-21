import yaml from "js-yaml";
import fs from "fs";
import Joi from "joi";
import { cleanEnv, str } from "envalid";
import envsub from "envsub";

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

type FileInjection = { file: string; url: string; content: string };
export type AppConfig = {
  site: {
    base_url: string;
    links: Array<string>;
    cookies: Array<{ key: string; value: string }>;
  };
  browser: {
    headless: boolean;
    inject: {
      css: Array<Partial<FileInjection>>;
      js: Array<Partial<FileInjection & { eval: string }>>;
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
      .default([]),
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
      css: Joi.array()
        .items(
          Joi.object({
            file: Joi.string(),
            content: Joi.string(),
            url: Joi.string(),
          }).xor("file", "content", "url")
        )
        .default([]),
      js: Joi.array()
        .items(
          Joi.object({
            file: Joi.string(),
            content: Joi.string(),
            url: Joi.string(),
            eval: Joi.string(),
          }).xor("file", "content", "url", "eval")
        )
        .default([]),
    }).default(),
  }).default(),
  output: Joi.object({
    dir: Joi.string().regex(pathRegex).default("./out"),
    type: Joi.string().valid("single", "separate").default("single"),
    filename: Joi.string().default("result"),
  }).default(),
}).required();

export const parseConfig = async (): Promise<AppConfig> => {
  if (!fs.existsSync(env.CONFIG_FILE)) {
    throw new Error(`config file missing: ${env.CONFIG_FILE}`);
  }
  const configFilePathWithEnvSubst = `${env.CONFIG_FILE}.tmp`;
  await envsub({
    templateFile: env.CONFIG_FILE,
    outputFile: configFilePathWithEnvSubst,
    options: { protect: false },
  });
  const doc = yaml.load(fs.readFileSync(configFilePathWithEnvSubst, "utf-8"));
  fs.unlinkSync(configFilePathWithEnvSubst);
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
