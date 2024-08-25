import yaml from "js-yaml";
import fs from "fs";
import Joi from "joi";
import envsub from "envsub";

interface FileInjection { file: string; url: string; content: string }
export interface AppConfig {
  site: {
    baseUrl: string;
    links: string[];
    cookies: { key: string; value: string }[];
  };
  browser: {
    headless: boolean;
    inject: {
      css: Partial<FileInjection>[];
      js: Partial<FileInjection & { eval: string }>[];
      assetLoadWaitMs: number;
    };
    viewport: {
      width: number;
      height: number;
    };
    pageTimeout: number;
  };
  output: {
    dir: string;
    type: "single" | "separate";
    filename?: string;
    filenameEval?: string;
  };
  concurrency: number;
}

// eslint-disable-next-line 
const relAbsPathRegex = /^(\/[^\/\0]*(\/[^\/\0]*)*|(\.\/|\.\.\/|[^\/].*))$/;
const configSchema = Joi.object({
  site: Joi.object({
    baseUrl: Joi.string()
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
    pageTimeout: Joi.number().default(30 * 1000),
    inject: Joi.object({
      assetLoadWaitMs: Joi.number().default(1 * 100),
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
    dir: Joi.string().regex(relAbsPathRegex).default("./out"),
    type: Joi.string().valid("single", "separate").default("single"),
    filename: Joi.string().default("result").when('type', {
      is: 'separate',
      then: Joi.forbidden().messages({
        'any.unknown': '"output.filename" is not allowed when "output.type" is set to "separate"'
      }),
      otherwise: Joi.optional()
    }),
    filenameEval: Joi.string().default(`document.title.replace(/[/\\?%*:|"<>]/g, '_').trim()`).when('type', {
      is: 'single',
      then: Joi.forbidden().messages({
        'any.unknown': '"output.filenameEval" is not allowed when "output.type" is set to "single"'
      }),
      otherwise: Joi.optional()
    }),
  }).default(),
  concurrency: Joi.number().default(1),
}).required();

export const parseConfig = async (configFile: string): Promise<AppConfig> => {
  if (!fs.existsSync(configFile)) {
    throw new Error(`config file missing: ${configFile}`);
  }
  const configFilePathWithEnvSubst = `${configFile}.tmp`;
  await envsub({
    templateFile: configFile,
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
  return value;
};
