//@ts-ignore
import * as fs from 'fs';

export function readJson(path: string): Array<any> {
  const content = fs.readFileSync(path, 'utf-8');
  return JSON.parse(content);
}

export function saveJson(path: string, data: { [key: string]: any }): void {
  fs.writeFileSync(path, JSON.stringify(data));
}

