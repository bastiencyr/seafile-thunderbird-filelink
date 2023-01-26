import * as seafile from './seafile-api.mjs';
let debug = true;

function log(msg) {
    if (debug)
        console.log(msg);
}

function isAccountConfigured(id) {
    browser.storage.local
        .get([id])
        .then(accountInfo => {
            if (accountInfo && accountInfo[id])
                return true
            else
                return false
        })
}

function getAccountConfig(id) {
    return browser.storage.local
        .get([id])
        .then(accountInfo => {
            if (accountInfo && accountInfo[id])
                return accountInfo[id]
            else
                return {
                    configured: false,
                    id
                }
        })
}

async function save() {
    // extract input value
    let rootUI = document.body;
    let accountId = new URL(location.href).searchParams.get("accountId");

    let server = rootUI.querySelector('#server');
    let username = rootUI.querySelector('#username');
    let password = rootUI.querySelector('#password');
    let error_message = rootUI.querySelector('#error_message');

    password.disabled = username.disabled = server.disabled = true;

    let acc = {
        server: server.value,
        username: username.value,
        password: password.value,
    };
    log(`Set the account : server: ${acc.server}, username: ${acc.username} in account ${accountId}`);
    log(location.href)

    let s = new seafile.Seafile(acc.server, acc.username, acc.password);
    let p = await s.ping();
    if (p) {
        error_message.innerHTML = "";
        await browser.storage.local.set({
            [accountId]: acc
        });

    } else {
        log("Can't set the account.")
        password.disabled = username.disabled = server.disabled = false;
        error_message.innerHTML = "The server is not reachable.";
    };


}

document.querySelector("#save").onclick = async () => {
    let accountId = new URL(location.href).searchParams.get("accountId");
    if (!isAccountConfigured(accountId))
        await save();
}

document.querySelector("#edit").onclick = async () => {
    let rootUI = document.body;
    let server = rootUI.querySelector('#server');
    let username = rootUI.querySelector('#username');
    let password = rootUI.querySelector('#password');
    password.disabled = username.disabled = server.disabled = false;
}


browser.cloudFile.onAccountDeleted.addListener(async account => {
    console.log(`account will be deleted :` + JSON.stringify(account));
    await browser.storage.local.remove(account.id);
});