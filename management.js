import * as seafile from './seafile-api.mjs';

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
        password: password.value
    };
    console.info(`Set the account : server: ${acc.server}, username: ${acc.username} in account ${accountId}`);

    let s = new seafile.Seafile(acc.server, acc.username, acc.password);
    let p = await s.ping();
    if (p) {
        error_message.innerHTML = "";
        await browser.storage.local.set({
            [accountId]: acc
        });
        password.type = "password";

    } else {
        console.warn("Can't set the account.");
        password.disabled = username.disabled = server.disabled = false;
        error_message.innerHTML = "The server is not reachable.";
    }

}

document.querySelector("#save").onclick = async () => {
    console.group("Save account");
    let accountId = new URL(location.href).searchParams.get("accountId");
    await save();
    console.groupEnd();
};

document.querySelector("#edit").onclick = async () => {
    let rootUI = document.body;
    let server = rootUI.querySelector('#server');
    let username = rootUI.querySelector('#username');
    let password = rootUI.querySelector('#password');
    password.value = "";
    password.type = "text";
    password.disabled = username.disabled = server.disabled = false;
};


browser.cloudFile.onAccountDeleted.addListener(async account => {
    console.group("Remove account");
    console.info(`Account will be deleted :` + JSON.stringify(account));
    await browser.storage.local.remove(account.id);
    console.groupEnd();
});