const {
    SeafileAPI
} = require('seafile-js');



let rootUI = document.body;
let server = rootUI.querySelector('#server');
let username = rootUI.querySelector('#username');
let accountId = new URL(location.href).searchParams.get("accountId");
let password = rootUI.querySelector('#password');

browser.storage.local.get([accountId]).then(accountInfo => {
    if ("server" in accountInfo[accountId]) {
        server.value = accountInfo[accountId].server;
        server.disabled = true;
    }
    if ("username" in accountInfo[accountId]) {
        username.value = accountInfo[accountId].username;
        username.disabled = true;
    }
    if ("password" in accountInfo[accountId]) {
        password.value = accountInfo[accountId].password;
        password.type = "password";
        password.disabled = true;
    }
});

async function save() {

    let rootUI = document.body;
    let accountId = new URL(location.href).searchParams.get("accountId");

    let server = rootUI.querySelector('#server');
    let username = rootUI.querySelector('#username');
    let password = rootUI.querySelector('#password');
    let error_message = rootUI.querySelector('#error_message');
    password.disabled = username.disabled = server.disabled = true;

    const seafileAPI = new SeafileAPI();
    seafileAPI.init({
        server: server.value,
        username: username.value,
        password: password.value
    });


    try {
        const response = await seafileAPI.login();
        let acc = {
            server: server.value,
            username: username.value,
            password: password.value
        };
        console.info(`Set the account : server: ${acc.server}, username: ${acc.username} in account ${accountId}`);

        error_message.innerHTML = "";
        await browser.storage.local.set({
            [accountId]: acc
        });
        password.type = "password";
        browser.cloudFile.updateAccount(accountId, {
            "configured": true
        });
    } catch (error) {
        console.warn("Can't set the account.");
        password.disabled = username.disabled = server.disabled = false;

        if (error.response) {
            console.log(error.response.data);
            console.log(error.response.status);
            console.log(error.response.headers);
            error_message.innerHTML = "Wrong password or username.";
        } else if (error.request) {
            error_message.innerHTML = "Check your internet connection or your server address.";
            console.log(error.request);
        } else {
            console.error('Error', error.message);
        }
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