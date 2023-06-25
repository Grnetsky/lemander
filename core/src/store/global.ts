import pkg from "../../package.json";

export const globalStore: {
  version:string;
}  = {
  version:pkg.version
}