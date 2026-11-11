import { readFileSync } from "fs";
import { lib, MD5 } from "crypto-js";
import OSS from "ali-oss";
import { warning } from "@actions/core";
import { parseHTML } from "linkedom";
import { getExtInfo } from "ext-preview";
import { saveProject } from "./saveProject";

const { document } = parseHTML(
  "<!DOCTYPE html><html><head></head><body></body></html>",
);
(globalThis as any).document = document;

function getDate(): string {
  return new Date().toLocaleString("en-US", { timeZone: "Asia/Shanghai" });
}

async function saveExtFile(
  oss: OSS,
  extContent: string
): Promise<string> {
  return saveStringAsset(oss, extContent, "js");
}

async function saveSvg(
  oss: OSS,
  svg: string,
): Promise<string> {
  return saveStringAsset(oss, svg, "svg");
}

export async function saveStringAsset(
  oss: OSS,
  content: string,
  format: string,
): Promise<string> {
  const md5 = MD5(content).toString();
  try {
    await oss.put(`user_projects_assets/${md5}.${format}`, Buffer.from(content));
  } catch (e) {
    warning(`[CCW Extension Deploy] OSS File ${md5}.${format} already exists`);
  }
  return `https://m.ccw.site/user_projects_assets/${md5}.${format}`;
}

export async function saveCover(
  oss: OSS,
  coverPath: string,
  userFolder: string,
): Promise<string> {
  const format = coverPath.split(".").pop() || "png";
  const cover = readFileSync(coverPath);
  const md5 = MD5(lib.WordArray.create(cover)).toString();
  try {
    await oss.put(`works-covers/${userFolder}/${md5}.${format}`, Buffer.from(cover));
  } catch (e) {
    warning(`[CCW Extension Deploy] OSS File ${md5}.${format} already exists`);
  }
  return `https://m.ccw.site/works-covers/${userFolder}/${md5}.${format}`;
}

export async function deploy(
  oss: OSS,
  extPath: string,
  eid: string,
  userFolder: string,
  sb3MD5: string,
  coverPath: string,
): Promise<{projectLink: string, previewSvg: string, coverLink: string, extLink: string}> {
  const extContent = readFileSync(extPath).toString("utf-8");
  const extMD5 = MD5(extContent).toString();
  
  const extLink = await saveExtFile(oss, extContent);
  const {project, svg} = await getExtInfo(extContent, extLink, eid, extMD5);
  const projectLink = await saveProject(oss, userFolder, sb3MD5, project);
  const previewSvg = await saveSvg(oss, svg);
  const coverLink = await saveCover(oss, coverPath, userFolder);
  return {projectLink, previewSvg, coverLink, extLink};
}
