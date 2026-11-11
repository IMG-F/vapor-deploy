import OSS from "ali-oss";
import { AES, enc, mode } from "crypto-js";
import JSZip from "jszip";

export async function saveProject(
  oss: OSS,
  userFolder: string,
  sb3MD5: string,
  projectJson: string,
): Promise<string> {
  const encryptedProjectJSON = encryptProjectJSON(projectJson);
  const sb3 = new JSZip();
  sb3.file("project.json", encryptedProjectJSON);
  const bytes = await sb3.generateAsync({
    type: "uint8array",
    compression: "DEFLATE",
    compressionOptions: {
      level: 6,
    },
  });
  const encryptedSb3 = encryptSb3(bytes, sb3MD5);
  const buffer = Buffer.from(encryptedSb3);
  await oss.put(`user_projects_sb3/${userFolder}/${sb3MD5}.sb3`, buffer);
  return `https://m.ccw.site/user_projects_sb3/${userFolder}/${sb3MD5}.sb3`;
}

function encryptSb3(bytes: Uint8Array, sb3MD5: string) {
  const key = enc.Base64.parse("KzdnFCBRvq3" + sb3MD5);
  key.sigBytes = 32;
  const iv = key.clone();
  iv.sigBytes = 16;
  iv.words.splice(4);
  const plain = enc.Utf8.parse(bytes.toString());
  return AES.encrypt(plain, key, {
    iv,
    mode: mode.CBC,
  }).toString();
}

function encryptProjectJSON(projectJson: string) {
  const map = ["b", "x", "e", "y", "g", "i", "u", "c", "1", "2", "c"];
  const projectJSON = JSON.stringify(projectJson);
  const plainBs64 = btoa(encodeURIComponent(projectJSON));
  const { length: t } = plainBs64;
  const n = t % 10;
  const r = plainBs64.charAt(n);
  return `${plainBs64.substring(0, n)}${map[n]}${plainBs64.substring(n + 1)}${r}`;
}
