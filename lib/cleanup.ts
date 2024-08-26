import fs from "fs";
import path from "path";

export const cleanOutputDirectoryExcept = (
  whitelistedFileNameList: string[],
  outputDirectory: string
) => {
  const files = fs.readdirSync(outputDirectory);
  const filesNotInList = files.filter(
    (it) => !whitelistedFileNameList.includes(it)
  );
  if (!filesNotInList.length) return;

  filesNotInList.forEach((it) => {
    const filePath = path.join(outputDirectory, it);
    fs.unlinkSync(filePath);
  });
  console.debug("Deleted Files: ", filesNotInList.join(", "));
};
