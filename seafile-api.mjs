let debug = true;

function log(msg) {
    if (debug)
        console.log(msg);
}

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
        throw new SeafileError(res.status, msg)
    } catch (e) {
        throw new SeafileError(res.status, res.statusText)
    }
}



class Seafile {
    constructor(server, username) {
        this.server = server;
        this.username = username;
        this.token = "";
        this.headers = "";
        log(`server = ${this.server}`);
        log(`username = ${this.username}`);
    }

    async setToken(password) {
        let endPoint = `${this.server}/api2/auth-token/`;
        let formEncoding = new FormData();
        formEncoding.append('username', this.username);
        formEncoding.append('password', password);

        let res = await fetch(endPoint, {
            method: 'POST',
            body: formEncoding
        });

        if (res.ok) {
            let body, token;
            try {
                body = await res.json();
                this.token = body.token;

                this.headers = {
                    'Authorization': `Token ${this.token}`,
                    'Accept': 'application/json',
                    mode: 'cors'
                };
                log(`Token set: ${this.token}`);
                return this.token;

            } catch (e) {
                throw new SeafileError(res.status, `1 cannot retreive token: ${e.message}`)
            }
        } else {
            throw new SeafileError(res.status, `2 cannot retreive token: ${res.statusText}`)
        }
    }

    async getLibraries() {
        let endPoint = `${this.server}/api2/repos/?type=mine`;
        let res = await fetch(endPoint, {
            headers: this.headers,
            method: 'GET'
        });
        if (res.ok) {
            let repos;
            try {
                repos = await res.json();
                return repos.map(i => ({
                    name: i.name,
                    id: i.id
                }))
            } catch (e) {
                throw new SeafileError(res.status, e.message)
            }
        } else
            goErr(res);
    }

    async searchLibraryByName(name) {
        let libs = await this.getLibraries();
        return libs.find(l => l.name == name)
    }

    async createLibrary(name, desc = 'thunderbird_attachments') {
        let endPoint = `${this.server}/api2/repos/`;
        let formEncoding = new FormData();
        formEncoding.append('name', name);
        formEncoding.append('desc', desc);
        let res = await fetch(endPoint, {
            headers: this.headers,
            method: 'POST',
            body: formEncoding
        });

        if (res.ok) {
            let repo;
            try {
                repo = await res.json();
                return {
                    name: repo.repo_name,
                    id: repo.repo_id
                }
            } catch (e) {
                throw new SeafileError(res.status, e.message)
            }
        } else
            goErr(res);
    }

    async createLibraryIfNotExist() {
        let seafLib = await this.searchLibraryByName('thunderbird_attachments');
        if (!seafLib) {
            log(`Create library thunderbird_attachments !`);
            seafLib = await this.createLibrary('thunderbird_attachments');
        }
        return seafLib;
    }

    async ping() {

        let endPoint = `${this.server}/api2/server-info/`;
        let res = await fetch(endPoint).then((response) => {
            log(response);
            if (response.ok)
                return true
            return false
        }).catch((error) => {
            log(error);
            return false;
        });
        if (res)
            return true
        return false;
        //await goErr(res);
    }

    async existsDir(path, repoId) {
        let endPoint = `${this.server}/api/v2.1/repos/${repoId}/dir/detail/?path=${path}`;
        let res = await fetch(endPoint, {
            headers: this.headers
        });
        if (res.status == 404)
            return false
        if (res.ok)
            return true
        // other cases
        await goErr(res);
    }

    async mkdir(path, repoId) {
        let endPoint = `${this.server}/api2/repos/${repoId}/dir/?p=${path}`;
        let formEncoding = new FormData();
        let headers = this.headers;
        formEncoding.append('operation', 'mkdir');
        let res = await fetch(endPoint, {
            headers: this.headers,
            method: 'POST',
            body: formEncoding
        });

        if (res.ok)
            return path
        await goErr(res);
    }

    async getUploadLink(path, repoId) {

        let endPoint = `${this.server}/api2/repos/${repoId}/upload-link/?p=${path}`;
        let res = await fetch(endPoint, {
            headers: this.headers
        });
        if (res.ok) {
            let uploadLink = await res.json();
            return `${uploadLink}?ret-json=1`
        }
        await goErr(res);
    }

    async upload(basedir, fileName, fileContent, repoId) {
        let endPoint = await this.getUploadLink(basedir, repoId);
        let formEncoding = new FormData();
        formEncoding.append('filename', fileName);
        formEncoding.append('parent_dir', `${basedir}`);
        formEncoding.append('replace', "1");
        formEncoding.append('file', fileContent);

        let res = await fetch(endPoint, {
            method: 'POST',
            headers: this.headers,
            body: formEncoding
        });
        if (res.ok) {
            let ups = await res.json();
            return ups[0]
        }
        await goErr(res);
    }

    async createDownloadLink(path, repoId) {
        let endPoint = `${this.server}/api/v2.1/share-links/`;
        let payload = {
            repo_id: repoId,
            path
        };
        let res = await fetch(endPoint, {
            headers: Object.assign({
                'Content-Type': 'application/json'
            }, this.headers),
            body: JSON.stringify(payload),
            method: 'POST'
        });
        if (res.ok)
            return await res.json()

        await goErr(res);
    }

    async getDownloadLink(path, repoId) {
        let endPoint = `${this.server}/api/v2.1/share-links/?repo_id=${repoId}&path=${path}`;
        let res = await fetch(endPoint, {
            headers: this.headers
        });
        if (res.ok) {
            let links = await res.json();
            if (links[0]) console.log(links[0]);
            if (links.length > 0)
                return links[0]
            else
                return await this.createDownloadLink(path, repoId)

        }
        await goErr(res);
    }
}

export {
    Seafile,
    SeafileError,
    goErr,
    log
};