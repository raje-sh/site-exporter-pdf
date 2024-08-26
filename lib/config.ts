import yaml from "js-yaml";
import fs from "fs";
import Joi from "joi";
import envsub from "envsub";
import { PDFOptions } from "puppeteer";
import { debug, error } from "./logger";

const defaultPDFOptions: Omit<PDFOptions, 'path'> = {
  format: "A4",
  margin: {
    top: 20,
    bottom: 20,
    left: 20,
    right: 20,
  },
}


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
    pdfOptions?: Omit<PDFOptions, 'path'>;
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
    pdfOptionsAsJSON: Joi.string().default(JSON.stringify(defaultPDFOptions)),
    // pdfOptionsAsJSON: Joi.string().default(JSON.stringify(defaultPDFOptions)),
  }).default(),
  concurrency: Joi.number().default(3),
}).required();

export const parseConfig = async (configFile: string): Promise<AppConfig> => {
  debug('parsing config file: %s', configFile);
  if (!fs.existsSync(configFile)) {
    debug('config file: %s not found', configFile);
    throw new Error(`config file missing: ${configFile}`);
  }
  const configFilePathWithEnvSubst = `${configFile}.tmp`;
  await envsub({
    templateFile: configFile,
    outputFile: configFilePathWithEnvSubst,
    // Note: changing options may have undesirable effects. refer: https://www.npmjs.com/package/envsub#with---env-or---env-file-and---all
    options: { all: true, envs: [] },
  });
  debug('substituted env-vars in config file to %s', configFilePathWithEnvSubst);
  const doc = yaml.load(fs.readFileSync(configFilePathWithEnvSubst, "utf-8"));
  fs.unlinkSync(configFilePathWithEnvSubst);
  debug('deleted tmp config file: %s', configFilePathWithEnvSubst);
  const { error: errorDetails, value } = configSchema.validate(doc, {
    abortEarly: false,
    stripUnknown: true,
  });
  if (errorDetails) {
    const errorMsg = errorDetails.details.map((it) => it.message).join("\n");
    error('config validation errors found: %o', errorMsg);
    throw new Error(errorMsg);
  }
  value.output.pdfOptions = parsePDFOptions(value.output.pdfOptionsAsJSON);
  debug('config validation done: %o', value);
  return value;
};

const parsePDFOptions = (json: string) => {
  const pdfOptions = JSON.parse(json!!.trim())
  const allowedProps = ['timeout', 'scale', 'displayHeaderFooter', 'headerTemplate', 'footerTemplate', 'printBackground', 'landscape', 'pageRanges', 'format', 'width', 'height', 'preferCSSPageSize', 'margin', 'path', 'omitBackground', 'tagged', 'outline', 'timeout', 'waitForFonts']
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return Object.keys(pdfOptions).filter(it => allowedProps.includes(it)).reduce((prev, it) => ({ ...prev, [it]: pdfOptions[it] }), {})
}