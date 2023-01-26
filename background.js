import * as seafile from './seafile-api.mjs';
let debug2 = true;

function log2(msg) {
    if (debug2)
        console.log(msg);
}
let uploads = new Map();

const getSeafileAccount = async id =>
    browser.storage.local.get(id)
    .then(accs => accs && accs[id]);

browser.cloudFile.onFileUpload.addListener(async (account, fileInfo, tab) => {
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
        server,
        debugConsole
    } = await getSeafileAccount(account.id);

    let s = new seafile.Seafile(server, username);
    let token = await s.setToken(password);

    //create library on the server, default one is "thunderbird_attachments"
    let seafLib = await s.createLibraryIfNotExist();
    let repoId = seafLib.id;
    await s.upload(`/`, fileName, fileContent, repoId);

    // Get the link
    let downloadLink = await s.getDownloadLink(`/${fileName}`, repoId);

    delete uploadInfo.abortcontroller;
    return {
        url: `${downloadLink.link}?dl=1`
    };

});

browser.cloudFile.onFileUploadAbort.addListener((account, id) => {
    log(`File upload is getting aborted`);
    let uploadInfo = uploads.get(id);
    if (uploadInfo && uploadInfo.abortController) {
        log(`Abort abort !!`);
        uploadInfo.abortController.abort();
    }
});

browser.cloudFile.onFileDeleted.addListener((account, fileId, tab) => {
    log(`File deleted ` + JSON.stringify(fileId));
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
    log2(`Account has been added :` + JSON.stringify(account));
});