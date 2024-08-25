import path from 'path';
import {
    describe, expect, test, beforeEach
    , afterEach
} from '@jest/globals';
import { cleanOutputDirectoryExcept } from '../cleanup';
import fs from 'fs'
import os from 'os'


describe('cleanup files', () => {
    let targetDir: string;
    beforeEach(() => {
        targetDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jest-'));
    });
    afterEach(() => {
        fs.rmdirSync(targetDir, { recursive: true });
    });
    function createRandomFiles(targetDir: string, numberOfFiles: number) {
        for (let i = 0; i < numberOfFiles; i++) {
            fs.writeFileSync(path.join(targetDir, `file${i}.txt`), 'hello');
        }
        return fs.readdirSync(targetDir).map(file => path.join(targetDir, file));
    }
    function getFiles(targetDir: string) {
        return fs.readdirSync(targetDir).map(file => path.join(targetDir, file));
    }

    test("delete all files", () => {
        createRandomFiles(targetDir, 5);
        expect(getFiles(targetDir).length).toBe(5);
        cleanOutputDirectoryExcept([], targetDir);
        expect(getFiles(targetDir).length).toBe(0);
    });
    test("delete all files except one", () => {
        const [file1] = createRandomFiles(targetDir, 5);
        const fileToRemain = path.basename(file1);
        expect(getFiles(targetDir).length).toBe(5);
        cleanOutputDirectoryExcept([fileToRemain], targetDir);
        const filesList = getFiles(targetDir);
        expect(filesList.length).toBe(1);
        expect(filesList[0]).toBe(file1);
    });
    test("don't delete any files if all are whitelisted", () => {
        const filenames = createRandomFiles(targetDir, 5).map(it => path.basename(it))
        expect(getFiles(targetDir).length).toBe(5);
        cleanOutputDirectoryExcept(filenames, targetDir);
        expect(getFiles(targetDir).length).toBe(5);
    });

});
