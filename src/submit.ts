import { requestUtils } from "@ccw-api/request";

const url = "https://bfs-web.ccw.site/extensions/submit";

export type Req = {
    icon: string;
    assetUri: string;
    creationId: string;
    cover: string;
    eid: string;
    version: string;
    name: string;
    description: string;
    readme: string;
    releaseTags: string[];
    changelog: string;
    tags: string[];
    previews: string[];
    projectLink: string;
}

export async function submitExtension(req: Req): Promise<{data: any}> {
    return await requestUtils.post<any>(url, req);
}