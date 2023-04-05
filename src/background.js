const {
    SeafileAPI
} = require('seafile-js');

class SeafileError extends Error {
    constructor(code, ...params) {
        super(...params);
        if (Error.captureStackTrace)
            Error.captureStackTrace(this, SeafileError);
        this.name = 'SeafileError';
        this.date = new Date();
        this.code = code;

    }
}

async function goErr(res) {
    try {
        let msg = await res.json();
        throw new SeafileError(res.status, msg);
    } catch (e) {
        throw new SeafileError(res.status, res.statusText);
    }
}

async function upload(endPoint, fileName, fileContent, token) {

    let formEncoding = new FormData();
    formEncoding.append('filename', fileName);
    formEncoding.append('parent_dir', `/`);
    formEncoding.append('file', fileContent);
    let headers = {
        'Authorization': `Token ${token}`,
        'Accept': 'application/json',
        mode: 'cors'
    };
    let res = await fetch(endPoint, {
        method: 'POST',
        headers: headers,
        body: formEncoding
    });
    if (res.ok) {
        let ups = await res.json();
        return ups[0];
    }
    await goErr(res);
}

let uploads = new Map();

const getSeafileAccount = async id =>
    browser.storage.local.get(id)
    .then(accs => accs && accs[id]);

browser.cloudFile.onFileUpload.addListener(async (account, fileInfo, tab) => {
    console.group("Upload file");
    let uploadInfo = {
        abortController: new AbortController()
    };
    let fileName = fileInfo.name;
    let fileContent = fileInfo.data;
    uploads.set(fileInfo.id, uploadInfo);
    console.log("File id: ", fileInfo.id);
    console.info("Start uploading of the file: ", fileName);

    // retreive account from local storage
    let {
        password,
        username,
        server
    } = await getSeafileAccount(account.id);

    const seafileAPI = new SeafileAPI();
    seafileAPI.init({
        server: server,
        username: username,
        password: password
    });

    // Login to set the token
    console.info("Login to the server ", server, " with username ", username);
    try {
        const response = await seafileAPI.login();
    } catch (e) {
        console.error("Can't login !")
        console.log(e);
        console.groupEnd();
        return {
            error: "Can't login to your seafile account. Check your internet" +
                " connection or your credentials."
        };
    }

    let tok = seafileAPI.token;

    // Create library if not exist
    console.info("Create library thunderbird_attachments on the server if not exist");
    let ls_lib;
    try {
        ls_lib = await seafileAPI.listRepos();
    } catch (e) {
        console.error("Can't list remote libraries !");
        console.log(e);
        console.groupEnd();
        return {
            error: "Can't list the libraries on your seafile account. Check your internet connection."
        };
    }
    
    function isLibAttachments(lib) {
        return lib.repo_name === "thunderbird_attachments";
    }
    let repoId;
    if (ls_lib.data.repos.find(isLibAttachments) === undefined) {
        try {
            let repo = {
                name: "thunderbird_attachments"
            };
            seafileAPI.createMineRepo(repo);
        } catch (e) {
            console.error("Can't create the attachment library !");
            console.log(e);
            console.groupEnd();
            return {
                error: "Can't create the library. Check your internet connection."
            };
        }
    }

    ls_lib = await seafileAPI.listRepos();
    repoId = ls_lib.data.repos.find(isLibAttachments).repo_id;

    // Upload the file with the upload link
    let endPoint = await seafileAPI.getFileServerUploadLink(repoId, "/");

    let res;
    try {
        res = await upload(endPoint.data, fileName, fileContent, tok);
    } catch (e) {
        console.error("Can't upload the file !");
        console.log(e);
        console.groupEnd();
        return {
            error: "Can't upload the file. Check your internet connection."
        };
    }
    // Update the filename in case of the server chose another filename 
    // to avoid conflicts
    fileName = res.name;

    // Create and get the upload link
    console.info("Create share link");
    try {
        await seafileAPI.createShareLink(repoId, `/${fileName}`);
    } catch (e) {
        console.log("Can't create the share link !");
        console.error(e);
        console.groupEnd();
        return {
            error: "Can't create the share link. Check your internet connection."
        };
    }
    let downloadLink = await seafileAPI.getShareLink(repoId, `/${fileName}`);

    delete uploadInfo.abortcontroller;
    console.groupEnd();
    return {
        url: `${downloadLink.data[0].link}?dl=1`
    };
});

browser.cloudFile.onFileUploadAbort.addListener((account, id) => {
    console.info(`File upload is getting aborted`);
    let uploadInfo = uploads.get(id);
    if (uploadInfo && uploadInfo.abortController) {
        console.info(`Abort abort !!`);
        uploadInfo.abortController.abort();
    }
});

browser.cloudFile.onFileDeleted.addListener((account, fileId, tab) => {
    console.info(`File deleted ` + JSON.stringify(fileId));
    console.log(fileId);
});

browser.cloudFile.getAllAccounts().then(async (accounts) => {
    let allAccountsInfo = await browser.storage.local.get();
    for (let account of accounts) {
        await browser.cloudFile.updateAccount(account.id, {
            configured: account.id in allAccountsInfo
        });
    }
});


browser.cloudFile.onAccountAdded.addListener(account => {
    console.info(`Account has been added :` + JSON.stringify(account));
});