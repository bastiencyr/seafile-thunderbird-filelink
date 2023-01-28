import * as seafile from './seafile-api.mjs';

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

    let s = new seafile.Seafile(server, username);
    await s.setToken(password);

    //create library on the server, default one is "thunderbird_attachments"
    let seafLib = await s.createLibraryIfNotExist();
    let repoId = seafLib.id;
    await s.upload(`/`, fileName, fileContent, repoId);

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