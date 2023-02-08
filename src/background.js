import * as seafile from '../seafile-api.mjs';
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

    let s = new seafile.Seafile(server, username);
    await s.setToken(password);

    //create library on the server, default one is "thunderbird_attachments"
    let seafLib = await s.createLibraryIfNotExist();
    let repoId = seafLib.id;

    const response = await seafileAPI.login();
    let endPoint2 = await seafileAPI.getFileServerUploadLink(repoId, "/");
    let tok = await seafileAPI.getToken();
    console.info(endPoint2.data);

    try {
        await upload(endPoint2.data, fileName, fileContent, tok);
        console.groupEnd();
    } catch (e) {
        console.log(e);
    }

    // Get the link
    let downloadLink = await s.getDownloadLink(`/${fileName}`, repoId);

    delete uploadInfo.abortcontroller;
    console.groupEnd();
    return {
        url: `${downloadLink.link}?dl=1`
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