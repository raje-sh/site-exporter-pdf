import fs from 'fs';
import path from 'path';
import { AppConfig } from './config';
/* eslint-disable @typescript-eslint/no-extraneous-class */
/* eslint-disable @typescript-eslint/no-explicit-any */
// import path from 'path';

// type AnyFunction = (...args: any[]) => Promise<void> | void;

export interface HooksDefinition {
    onConfigParsingComplete: (config: any) => any;
}

export const loadHooks = async (hooksConfig: AppConfig['hooks']) => {
    if(!hooksConfig || !hooksConfig.hooksDirectory) return {};
    // copy all the files from hooksModulePath to the current directory under hooks dir
    const srcHooksDir  = path.join(__dirname, 'custom_hooks');
    // fs.copyFileSync(hooksConfig.hooksDirectory, srcHooksDir);
    if(!fs.existsSync(srcHooksDir)) {
        fs.mkdirSync(srcHooksDir);
    }
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    await (require('child_process').spawnSync('/bin/cp', ['-bf', hooksConfig.hooksDirectory, srcHooksDir], { stdio: 'ignore' }))
    // TODO: how does the running node process re-read the copied files?
    const srcFile = path.join(srcHooksDir, hooksConfig.indexFile);
    if(!fs.existsSync(srcFile)) {
        throw new Error(`Hooks index file ${hooksConfig.indexFile} not found in ${hooksConfig.hooksDirectory}`);
    }
    return (await import(srcFile)).default as Partial<HooksDefinition>;
}
