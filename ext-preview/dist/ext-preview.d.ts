declare namespace ExtPreview {
    function getExtInfo(
        js: string, 
        url: string, 
        extId: string,
        md5: string): Promise<{project: string, svg: string}>;
}

export = ExtPreview;