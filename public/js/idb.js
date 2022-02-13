// create variable to hold db connection
let db;

// establish a connection to IndexDB called 'bugdet_tracker' abd set it to version 1
const request = indexedDB.open('budget_tracker', 1);

// this will upgrade database if version changes
request.onupgradeneeded = function (event) {

    // save reference to the database
    const db = event.target.result;

    //create an object store table called 'new_transaction' and set it to have an auto-increment primary key
    db.createObjectStore('new_transaction', { autoIncrement: true });
};

// upon successful request
request.onsuccess = function(event) {

    // db successfully created with object store and/or connection established, save reference to db in global variable
    db = event.target.result;

    // check if app is online, if running, run uploadTransaction() function to send all local db data to api
    if (navigator.onLine) {
        uploadTransaction();
    }
};

// on error
request.onerror = function(event) {

    // log error
    console.log(event.target.errorCode);
};

// function to be executed if user attempts a new transaction w/ no internet connection
function saveRecord(record) {

    // open a new transaction w/ db read & write permissions
    const transaction = db.transaction(['new_transaction'], 'readwrite');

    // access object store for 'new_transaction'
    const budgetObjectStore = transaction.objectStore('new_transaction');

    // add record to your store with add method
    budgetObjectStore.add(record);
};

// uploadTransaction() function
function uploadTransaction() {

    //open transaction to user db
    const transaction = db.transaction(['new_transaction'], 'readwrite');

    // access object store
    const budgetObjectStore = transaction.objectStore('new_transaction');

    const getAll = budgetObjectStore.getAll();

    getAll.onsuccess = function() {

        // if there was data in indexedDb's store send it to the api server
        if (getAll.result.length > 0) {
            fetch('/api/transaction', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(serverResponse => {
                if (serverResponse.message) {
                    throw new Error(serverResponse);
                }

                //open one more transaction
                const transaction = db.transaction(['new_transaction'], 'readwrite');

                //access the new_transaction object store
                const budgetObjectStore = transaction.objectStore('new_transaction');

                //clear all items in store
                budgetObjectStore.clear();

                alert('All saved transactions have been subbitted!!!');
            })
            .catch(err => {
                console.log(err);
            });
        }
    }
};

//listen for app coming back online
window.addEventListener('online', uploadTransaction);