import fs from "fs";
import path from "path";
import { env } from "./env";

export const cleanOutputDirectoryExcept = (
  whitelistedFileNameList: Array<string>
) => {
  const files = fs.readdirSync(env.OUTPUT_DIR);
  const filesNotInList = files.filter(
    (it) => !whitelistedFileNameList.includes(it)
  );
  if (filesNotInList.length) {
    filesNotInList.forEach((it) => {
      const filePath = path.join(env.OUTPUT_DIR, it);
      fs.unlinkSync(filePath);
    });
    console.debug("Deleted Files: ", filesNotInList.join(", "));
  }
};
