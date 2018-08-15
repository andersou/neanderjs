// Funções privadas
//     Abrir o IDB
//     Fechar o IDB

// Funçoes Publicas
//     Salvar item
//     Pegar item
//     Deletar item
//     Pegar todos
//     Alterar item

// Item :
//     Nome
//     Data
//     Codigo
let DB_NAME = "neanderjs";
let DB_VERSION = 2;
let DB_OBJECT_STORE = "codigos";

function suportaIDB() {
    return !!window.indexedDB;
}
function _atualizacao(request, event) {
    let db = request.result;
    oldVersion = event.oldVersion;
    if(oldVersion < 1)
        db.createObjectStore(DB_OBJECT_STORE, { autoIncrement: true });
    if(oldVersion)
        request.transaction.objectStore(DB_OBJECT_STORE).createIndex("nome", "nome", {unique: true});
}
function _abrirDB() {
    return new Promise((resolve, reject) => {
        let request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onsuccess = function (event) {
            resolve(request.result);
        }
        request.onerror = function (event) {
            reject(request.errorCode);
        }
        request.onupgradeneeded = function (event) {
            _atualizacao(request,event);
        }
    })
}

function _fecharDB(db) {
    if (db) db.close();
}

function _getObjectStoreFromDb(db, mode) {
    return db.transaction(DB_OBJECT_STORE, mode).objectStore(DB_OBJECT_STORE);
}

function _getObjectStore() {
    return new Promise((res, rej) => {
        _abrirDB()
            .then(db => _getObjectStoreFromDb(db, "readwrite"))
            .then(os => res(os))
            .catch(err => {
                console.log(err);
                rej(err)
            })
    });
}
function inserirItem(item) {
    _getObjectStore().then((os) => {
        os.add(item);
    }).catch(err => {
        console.log(err);
    })
}
function removerItem(key) {
    _getObjectStore().then((os) => {
        os.delete(key);
    }).catch(err => {
        console.log(err);
    })
}
function carregarItem(key) {
    
    return _getObjectStore().then((os) => {
        return new Promise((res,rej)=>{
            tx = os.get(key);
            tx.onsuccess = function(event){
                res(tx.result);
            }
            tx.onerror = function(event){
                rej(tx.errorCode)
            }
        })
    }).catch(err => {
        console.log(err);
    })
}
function listarItems() {
    return _getObjectStore()
        .then((os) => os.openCursor())
        .then(cursor => new Promise((res, rej) => {
            items = [];
            cursor.onsuccess = function (event) {
                var cursor = event.target.result;
                if (cursor) {
                    items.push({key: cursor.key, value: cursor.value});
                    cursor.continue();
                } else {
                    res(items);
                }
            }
        }))



}

function gerarItemTeste() {
    return {
        nome: "Código Tal",
        data: new Date(),
        codigo: gerarHexmem()
    }
}