import fs from 'fs';
import { describe, expect, test, beforeEach, beforeAll } from '@jest/globals';
import path from 'path';
import os from 'os';
import download from 'download';
import { mergePDFs } from '../pdf';



describe('pdf', () => {
    const pdfFile1Url = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';

    let pdfDir: string;
    let targetDir: string;
    let file1Path: string;
    let file2Path: string;
    let mergedFile: string;
    beforeAll(() => {
        pdfDir = fs.mkdtempSync(path.join(os.tmpdir(), `jest-pdf-input-`));
        targetDir = fs.mkdtempSync(path.join(os.tmpdir(), `jest-pdf-output-`));
        file1Path = path.join(pdfDir, 'file1.pdf');
        file2Path = path.join(pdfDir, 'file2.pdf');
        mergedFile = path.join(targetDir, 'merged.pdf');
    });


    beforeEach(async () => {
        cleanFilesInDir(pdfDir);
        cleanFilesInDir(targetDir);
        fs.writeFileSync(file1Path, await download(pdfFile1Url));
        fs.writeFileSync(file2Path, await download(pdfFile1Url));
    });

    const cleanFilesInDir = (dir: string) => {
        const files = fs.readdirSync(dir);
        for (const file of files) {
            fs.unlinkSync(path.join(dir, file));
        }
    }


    test('merge', async () => {
        expect(fs.existsSync(file1Path)).toBeTruthy();
        expect(fs.existsSync(file2Path)).toBeTruthy();
        expect(fs.existsSync(mergedFile)).toBeFalsy();
        await mergePDFs([file1Path, file2Path], mergedFile);
        expect(fs.existsSync(mergedFile)).toBeTruthy();
        expect(fs.existsSync(file1Path)).toBeTruthy();
        expect(fs.existsSync(file2Path)).toBeTruthy();
    })


});
