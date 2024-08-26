import fs from 'fs';
import { describe, expect, test, afterAll, beforeAll } from '@jest/globals';
import path from 'path';
import os from 'os';
import { AppConfig, parseConfig } from '../config';
import { dump } from 'js-yaml';
import setWith from 'lodash.setwith'
import cloneDeep from 'lodash.clonedeep'


describe('config', () => {
    const defaultFileNameEval = `document.title.replace(/[/\\?%*:|"<>]/g, '_').trim()`;
    const configFilePath = path.join(os.tmpdir(), `${Date.now()}.yml`);
    const config1: Readonly<Partial<AppConfig>> = {
        site: {
            baseUrl: 'http://localhost:3000',
            links: [
                '/hello'
            ],
            cookies: []
        },
    }
    const config2: Readonly<Partial<AppConfig>> = {
        site: {
            ...config1.site!!,
            cookies: [{ key: 'key', value: 'value' }],
        },
        browser: {
            headless: false,
            inject: {
                css: [{
                    content: 'body { background-color: red; }',
                }],
                js: [
                    { url: 'https://code.jquery.com/jquery-3.7.1.min.js' },
                    { file: 'test.js' },
                    { eval: 'console.log("test")' }
                ],
                assetLoadWaitMs: 10000
            },
            viewport: {
                width: 1200,
                height: 720
            },
            pageTimeout: 20000,
        },
        concurrency: 5,
        output: {
            dir: './out',
            type: 'separate',
            filenameEval: 'document.URL'
        }
    }

    beforeAll(() => {
        writeConfigFile({});
    });
    afterAll(() => {
        fs.unlinkSync(configFilePath);
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const expectPromiseToThrowError = async (promise: Promise<any>, errorMsg: string) => {
        await expect(async () => {
            await promise
        }).rejects.toThrowError(errorMsg);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const writeConfigFile = (content: Readonly<Partial<AppConfig>>, override: Record<string, any> = {}) => {
        const tmpConfig = cloneDeep(content);
        Object.keys(override).forEach(key => setWith(tmpConfig, key, override[key], Object));
        fs.writeFileSync(configFilePath, dump(tmpConfig));
    }

    test('config file not exists', async () => {
        const nonExistentFilename = `${Date.now()}-xyz.yml`;
        expect(parseConfig(nonExistentFilename)).rejects.toThrowError(`config file missing: ${nonExistentFilename}`);
    })
    test('check default config', async () => {
        writeConfigFile(config1);
        const config = await parseConfig(configFilePath);
        expect(config.site.baseUrl).toEqual(config1.site?.baseUrl);
        expect(config.site.links).toEqual(config1.site?.links);
        expect(config.site.cookies).toEqual([]);
        expect(config.browser.headless).toEqual(true);
        expect(config.browser.inject.assetLoadWaitMs).toEqual(100);
        expect(config.browser.inject.js).toEqual([]);
        expect(config.browser.inject.css).toEqual([]);
        expect(config.browser.viewport.width).toEqual(1260);
        expect(config.browser.viewport.height).toEqual(968);
        expect(config.browser.pageTimeout).toEqual(30000);
        expect(config.concurrency).toEqual(3);
        expect(config.output.dir).toEqual('./out');
        expect(config.output.type).toEqual('single');
        expect(config.output.filename).toEqual('result');
        expect(config.output.filenameEval).toEqual(defaultFileNameEval);
    })
    test('check custom config', async () => {
        writeConfigFile(config2, { 'output.filename': undefined });
        const config = await parseConfig(configFilePath);
        expect(config.site.baseUrl).toEqual(config1.site?.baseUrl);
        expect(config.site.links).toEqual(config1.site?.links);
        expect(config.site.cookies).toEqual(config2.site?.cookies);
        expect(config.browser.headless).toEqual(config2.browser?.headless);
        expect(config.browser.inject).toEqual(config2.browser?.inject);
        expect(config.browser.viewport).toEqual(config2.browser?.viewport);
        expect(config.browser.pageTimeout).toEqual(config2.browser?.pageTimeout);
        expect(config.concurrency).toEqual(config2.concurrency);
        expect(config.output.dir).toEqual(config2.output?.dir);
        expect(config.output.filename).toEqual('result');
        expect(config.output.type).toEqual(config2.output?.type);
        expect(config.output.filenameEval).toEqual(config2.output?.filenameEval);
    })

    test('scheme must be either http or https', async () => {
        writeConfigFile(config2, { 'site.baseUrl': 'localhost:3000' });
        await expectPromiseToThrowError(parseConfig(configFilePath), "\"site.baseUrl\" must be a valid uri with a scheme matching the http|https pattern")
        writeConfigFile(config2, { 'site.baseUrl': 'abc/def' });
        await expectPromiseToThrowError(parseConfig(configFilePath), "\"site.baseUrl\" must be a valid uri with a scheme matching the http|https pattern")
    });
    test('baseUrl and links must be mandatory', async () => {
        writeConfigFile(config2, {
            'site.baseUrl': undefined
        });
        await expectPromiseToThrowError(parseConfig(configFilePath), "\"site.baseUrl\" is required")
        writeConfigFile(config2, {
            'site.links': undefined
        });
        await expectPromiseToThrowError(parseConfig(configFilePath), "\"site.links\" is required")
    });
    test('cookie can\'t miss either key or value', async () => {
        writeConfigFile(config1, {
            'site.cookies': [{ key: 'key' }]
        });
        await expectPromiseToThrowError(parseConfig(configFilePath), "\"site.cookies[0].value\" is required")
    });
    test('each injection should not provide multiple load types', async () => {
        writeConfigFile(config2, {
            'browser.inject.js': [
                { url: 'https://code.jquery.com/jquery-3.7.1.min.js', file: 'test.js' },
            ]
        });
        await expectPromiseToThrowError(parseConfig(configFilePath), "\"browser.inject.js[0]\" contains a conflict between exclusive peers [file, content, url, eval]")
    });

    test('accepting filename & filenameEval should depend on output.type', async () => {
        writeConfigFile(config2, { 'output.filename': 'hello' });
        await expectPromiseToThrowError(parseConfig(configFilePath), "\"output.filename\" is not allowed when \"output.type\" is set to \"separate\"")
        writeConfigFile(config2, { 'output.filename': undefined });
        expect(await parseConfig(configFilePath)).toBeTruthy();
        writeConfigFile(config2, { 'output.filenameEval': 'document.URL', 'output.type': 'separate' });
        expect(await parseConfig(configFilePath)).toBeTruthy();
        writeConfigFile(config2, { 'output.filenameEval': 'document.URL', 'output.type': 'single' });
        await expectPromiseToThrowError(parseConfig(configFilePath), "\"output.filenameEval\" is not allowed when \"output.type\" is set to \"single\"")
    })
    test('replace env vars', async () => {
        process.env.MY_BASEURL = 'https://pptr.dev/';
        writeConfigFile(config2, { 'site.baseUrl': '${MY_BASEURL}' });
        const result = await parseConfig(configFilePath);
        expect(result.site.baseUrl).toEqual(process.env.MY_BASEURL);
    })
    test('replace defined default value if env var is not initialized', async () => {
        writeConfigFile(config2, { 'site.baseUrl': '${MY_BASEURL_NOT_DEFINED:-https://whoami.com}' });
        const result = await parseConfig(configFilePath);
        expect(result.site.baseUrl).toEqual("https://whoami.com");
    })
    test('should not replace env var if not defined and default value not provided', async () => {
        const jsContent = 'console.log(`${hello}: ${document.title}`);';
        writeConfigFile(config2, { 'output.dir': '${MY_BASEURL_NOT_DEFINED}', 'browser.inject.js': [{ content: jsContent }] });
        const result = await parseConfig(configFilePath);
        expect(result.output.dir).toEqual("${MY_BASEURL_NOT_DEFINED}");
        expect(result.browser.inject.js[0].content).toEqual(jsContent);
    })
});
