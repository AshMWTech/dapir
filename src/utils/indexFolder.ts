import fs from 'fs';
import path from 'path';

export interface File { name: string, path: string, fullPath: string, directory: boolean };

function indexFolder (folderInput: string | string[], files: File[] = [], depth = -1): Promise<File[]> {
  let folder: string = Array.isArray(folderInput) ? path.join(...folderInput) : folderInput;
  folder = folder.replace(/^\.\//, process.cwd()+path.sep);
  return new Promise(async (resolve) => {
    let joined;
    for (const entry of fs.readdirSync(folder as string).sort((a,b) => a.includes('[') ? 1 : -1)) {
      joined = path.join(folder, entry);
      if (fs.lstatSync(joined).isDirectory()) {
        files.push({ name: entry, path: joined.replace(process.cwd()+path.sep, '').replace(path.sep+entry,''), fullPath: joined, directory: true });
        if (depth !== 0) {
          if (depth > 0) depth--;
          await indexFolder(joined, files, depth);
        }
      }
      else files.push({ name: entry, path: joined.replace(process.cwd()+path.sep, '').replace(path.sep+entry,''), fullPath: joined, directory: false });
    }
    resolve(files);
  })
}

export default indexFolder;