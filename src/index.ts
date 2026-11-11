import { error, getInput, info } from "@actions/core";
import { resolve } from "path";
import { setRequestUtils } from "@ccw-api/api";
import OSS from "ali-oss";
import { getOssToken } from "./getOssToken";
import { deploy } from "./deploy";
import { getUserFolderAndSb3MD5 } from "./resolveProjectUrl";
import { requestUtils, setToken } from "@ccw-api/request";
import { submitExtension } from "./submit";

const file = getInput("file") || "test.js";
const ccwToken = getInput("token") || process.env.CCW_TOKEN;
const root = process.env.GITHUB_WORKSPACE || "./";
const projectOid = getInput("project-oid") || process.env.PROJECT_OID;
const eid = getInput("eid") || process.env.EID;
const cover = getInput("cover") || process.env.COVER;
const version = getInput("version") || process.env.VERSION;
const name = getInput("name") || process.env.NAME;
const description = getInput("desc") || process.env.DESC;
const readme = getInput("readme") || process.env.README;
const changelog = getInput("changelog") || process.env.CHANGE_LOG;

if (!ccwToken || !projectOid) {
  error("[CCW Extension Deploy] config error!");
  process.exit(1);
}

setRequestUtils(requestUtils);

async function main() {
  setToken(ccwToken);
  const extPath = resolve(root, file);
  const coverPath = resolve(root, cover);
  info(`[CCW Extension Deploy] Deploying "${extPath}" to ccw...`);
  const { accessKeyId, accessKeySecret, stsToken } = await getOssToken();
  const oss = new OSS({
    refreshSTSToken: getOssToken,
    accessKeyId,
    accessKeySecret,
    stsToken,
    bucket: "zhishi",
    region: "oss-cn-beijing",
  });
  const { userFolder, sb3MD5, isTeamwork } =
    await getUserFolderAndSb3MD5(projectOid);

  const {projectLink, previewSvg, coverLink, extLink} = 
    await deploy(oss, extPath, eid, userFolder, sb3MD5, coverPath);

  await submitExtension({
    icon: "test",
    assetUri: extLink,
    creationId: projectOid,
    cover: coverLink,
    eid: eid,
    version: version,
    name: name,
    description: description,
    readme: readme,
    releaseTags: ["release"],
    changelog: changelog,
    tags: [],
    previews: [previewSvg],
    projectLink: projectLink,
  });
  
  info("[CCW Extension Deploy] Successfully deployed extension!");
}

main().catch((e) => error(`[ccw ext deploy] ${e}`));
