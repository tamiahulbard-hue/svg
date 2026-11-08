export function isSvgFile(path: string, isFile: boolean): boolean {
  return isFile && /\.svg$/i.test(path);
}
