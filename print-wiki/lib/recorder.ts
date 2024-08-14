import { PuppeteerScreenRecorder } from "puppeteer-screen-recorder";
import { Page } from "puppeteer";

const scrollToBottom = async function (page: Page) {
  await page.evaluate(async () => {
    await new Promise<void>((resolve) => {
      const distance = 100; // Scroll by 100px
      const delay = 250; // Delay of 100ms
      const maxTimePerPage = 20_000;

      const scrollInterval = setInterval(() => {
        window.scrollBy(0, distance);
        if (window.scrollY + window.innerHeight >= document.body.scrollHeight) {
          clearInterval(scrollInterval);
          resolve();
        }
      }, delay);
      setTimeout(() => {
        clearInterval(scrollInterval);
        resolve();
      }, maxTimePerPage);
    });
  });
};

export const record = async (page: Page, outputPath: string) => {
  const recorder = new PuppeteerScreenRecorder(page);
  await recorder.start(outputPath);
  await scrollToBottom(page);
  await recorder.stop();
};

export default { record };
