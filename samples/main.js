/**
 * Copyright 2017 Google, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * This application demonstrates how to perform basic operations on documents
 * in the Google Cloud Firestore API.
 *
 * For more information, see the top-level README.md and the documentation
 * at https://cloud.google.com/firestore/docs.
 */

'use strict';

const Firestore = require('@google-cloud/firestore');

var firestore = new Firestore();


function demoInitialize() {
    // [START firestore_demo_initialize]
    // Fetch data from Firestore
    firestore.collection('cities').get()
        .then(documentSet => {
            // Print the ID and contents of each document
            documentSet.forEach(doc => {
                console.log(doc.id, ' => ', doc.data());
            });
        })
        .catch(err => {
            // Error fetching documents
            console.log('Error', err);
        });
    // [END firestore_demo_initialize]
}

// ============================================================================
// https://firebase.google.com/docs/firestore/server/quickstart
// ============================================================================

function quickstartAddData() {
    // [START firestore_add_lovelace]
    var docRef = firestore.collection('users').doc('alovelace');

    var setAda = docRef.set({
        first: 'Ada',
        last: 'Lovelace',
        born: 1815
    });
    // [END firestore_add_lovelace]

    // [START firestore_add_turing]
    var aTuringRef = firestore.collection('users').doc('aturing')

    var setAlan = aTuringRef.set({
        'first': 'Alan',
        'middle': 'Mathison',
        'last': 'Turing',
        'born': 1912
    });
    // [END firestore_add_turing]

    return Promise.all([setAda, setAlan]);
}

function quickstartQuery() {
    // [START firestore_quickstart_query]
    // Realtime listens are not yet supported in the Node.js SDK
    var query = firestore.collection('users').where('born', '<', 1900)
        .get()
        .then(snapshot => {
            snapshot.forEach(doc => {
                console.log(doc.id, '=>', doc.data());
            });
        })
        .catch(err => {
            console.log('Error getting documents', err);
        });
    // [END firestore_quickstart_query]

    return query;
}

function quickstartListen() {
    // [START firestore_quickstart_listen]
    firestore.collection('users').get()
        .then((snapshot) => {
            snapshot.forEach((doc) => {
                console.log(doc.id, '=>', doc.data());
            });
        })
        .catch((err) => {
            console.log('Error getting documents', err);
        });
    // [END firestore_quickstart_listen]
}

// ============================================================================
// https://firebase.google.com/docs/firestore/data-model
// ============================================================================

function basicReferences() {
    // [START firestore_doc_ref]
    var alovelaceDocumentRef = firestore.collection('users').doc('alovelace');
    // [END firestore_doc_ref]

    // [START firestore_collection_ref]
    var usersCollectionRef = firestore.collection('users');
    // [END firestore_collection_ref]
}

function advancedReferences() {
    // [START firestore_doc_ref_alternate]
    var alovelaceDocumentRef = firestore.doc('users/alovelace');
    // [END firestore_doc_ref_alternate]

    // [START firestore_subcollection_ref]
    var messageRef = firestore.collection('rooms').doc('roomA')
        .collection('messages').doc('message1');
    // [END firestore_subcollection_ref]
}

// ============================================================================
// https://firebase.google.com/docs/firestore/server/save-data
// ============================================================================

function setDocument() {
    // [START firestore_set_document]
    var data = {
        name: 'Los Angeles',
        state: 'CA',
        country: 'USA'
    };

    // Add a new document in collection "cities" with ID 'DC'
    var setDoc = firestore.collection('cities').doc('LA').set(data);
    // [END firestore_set_document]

    return setDoc.then(res => {
        console.log('Set: ', res);
    });
}

function dataTypes(){
    // [START firestore_data_types]
    var data = {
        stringExample: 'Hello, World!',
        booleanExample: true,
        numberExample: 3.14159265,
        dateExample: new Date('December 10, 1815'),
        arrayExample: [5, true, 'hello'],
        nullExample: null,
        objectExample: {
            a: 5,
            b: true
        }
    };

    var setDoc = firestore.collection('data').doc('one').set(data);
    // [END firestore_data_types]

    return setDoc.then(res => {
        console.log('Set: ', res);
    });
}

function addDocument() {
    // [START firestore_add_document]
    // Add a new document with a generated id.
    var addDoc = firestore.collection('cities').add({
        name: 'Tokyo',
        country: 'Japan'
    }).then(ref => {
        console.log('Added document with ID: ', ref.id);
    });
    // [END firestore_add_document]

    return addDoc.then(res => {
        console.log('Add: ', res);
    });
}

function addDocumentWithId() {
    data = { foo: 'bar '};

    // [START firestore_add_document_id]
    firestore.collection('cities').doc('new-city-id').set(data);
    // [END firestore_add_document_id]
}

function addLater() {
    // [START firestore_add_later]
    var newCityRef = firestore.collection('cities').doc();

    // Later...
    var setDoc = newCityRef.set({
        // ...
    })
    // [END firestore_add_later]

    return setDoc.then(res => {
        console.log('Add: ', res);
    });
}

function updateDocument() {
    // [START firestore_update_document]
    var cityRef = firestore.collection('cities').doc('DC');

    // Set the 'capital' field of the city
    var updateSingle = cityRef.update({ capital: true });
    // [END firestore_update_document]

    return Promise.all([updateSingle]).then(res => {
        console.log('Update: ', res);
    });
}

function updateDocumentMany() {
    // [START firestore_update_document_many]
    var cityRef = firestore.collection('cities').doc('DC');

    var updateMany = cityRef.update({
        name: 'Washington D.C.',
        country: 'USA',
        capital: true
    });
    // [END firestore_update_document_many]

    return updateMany.then(res => {
        console.log('Update: ', res);
    });
}

function updateCreateIfMissing() {
    // [START firestore_update_create_if_missing]
    var cityRef = firestore.collection('cities').doc('BJ');

    var setWithOptions = cityRef.set({
        capital: true
    }, { merge: true });
    // [END firestore_update_create_if_missing]

    return setWithOptions.then(res => {
        console.log('Update: ', res);
    });
}

function updateServerTimestamp() {
    // Create the object before updating it (racy on first run, oh well)
    firestore.collection('objects').doc('some-id').set({});

    // [START firestore_update_with_server_timestamp]
    // Get the `FieldValue` object
    var FieldValue = require("@google-cloud/firestore").FieldValue;

    // Create a document reference
    var docRef = firestore.collection('objects').doc('some-id');

    // Update the timestamp field with the value from the server
    var updateTimestamp = docRef.update({
        timestamp: FieldValue.serverTimestamp()
    });
    // [END firestore_update_with_server_timestamp]

    return updateTimestamp.then(res => {
        console.log('Update: ', res);
    });
}

function updateDeleteField() {
    // [START firestore_update_delete_field]
    // Get the `FieldValue` object
    var FieldValue = require("@google-cloud/firestore").FieldValue;

    // Create a document reference
    var cityRef = firestore.collection('cities').doc('BJ');

    // Remove the 'capital' field from the document
    var removeCapital = cityRef.update({
        capital: FieldValue.delete()
    });
    // [END firestore_update_delete_field]

    return removeCapital.then(res => {
        console.log('Update: ', res);
    });
}

function updateNested() {
    // [START firestore_update_nested]
    var initialData = {
        name: 'Frank',
        age: 12,
        favorites: {
            food: 'Pizza',
            color: 'Blue',
            subject: 'recess'
        }
    }

    // [START_EXCLUDE]
    firestore.collection('users').doc('Frank').set(initialData);
    // [END_EXCLUDE]
    var updateNested = firestore.collection('users').doc('Frank').update({
        age: 13,
        favorites: {
            color: 'Red'
        }
    });
    // [END firestore_update_nested]

    return updateNested.then(res => {
        console.log('Update: ', res);
    });
}

function deleteDocument() {
    // [START firestore_delete_document]
    var deleteDoc = firestore.collection('cities').doc('DC').delete();
    // [END firestore_delete_document]

    return deleteDoc.then(res => {
        console.log('Delete: ', res);
    });
}

function transaction() {
    // [START firestore_transaction]
    // Initialize document
    var cityRef = firestore.collection('cities').doc('SF');
    var setCity = cityRef.set({
        name: 'San Francisco',
        state: 'CA',
        country: 'USA',
        capital: false,
        population: 860000
    });

    var transaction = firestore.runTransaction(t => {
        return t.get(cityRef)
            .then(doc => {
                // Add one person to the city population
                var newPopulation = doc.data().population + 1;
                t.update(cityRef, { population: newPopulation });
            });
    })
    .then(result => {
        console.log('Transaction success!');
    })
    .catch(err => {
        console.log('Transaction failure:', err);
    });
    // [END firestore_transaction]

    return transaction;
}

function transactionWithResult() {
    // [START firestore_transaction_with_result]
    var cityRef = firestore.collection('cities').doc('SF');
    var transaction = firestore.runTransaction(t => {
        return t.get(cityRef)
            .then(doc => {
                var newPopulation = doc.data().population + 1;
                if (newPopulation <= 1000000) {
                    t.update(cityRef, { population: newPopulation });
                    return Promise.resolve('Population increased to ' + newPopulation);
                } else {
                    return Promise.reject('Sorry! Population is too big.');
                }
            });
    })
    .then(result => {
        console.log('Transaction success', result);
    })
    .catch(err => {
        console.log('Transaction failure:', err);
    });
    // [END firestore_transaction_with_result]

    return transaction;
}

function updateBatch() {
    // [START firestore_update_data_batch]
    // Get a new write batch
    var batch = firestore.batch();

    // Set the value of 'NYC'
    var nycRef = firestore.collection('cities').doc('NYC');
    batch.set(nycRef, { name: 'New York City' });

    // Update the population of 'SF'
    var sfRef = firestore.collection('cities').doc('SF');
    batch.update(sfRef, { population: 1000000 });

    // Delete the city 'LA'
    var laRef = firestore.collection('cities').doc('LA');
    batch.delete(laRef);

    // Commit the batch
    return batch.commit().then(function () {
        // [START_EXCLUDE]
        console.log('Batched.');
        // [END_EXCLUDE]
    });
    // [END firestore_update_data_batch]
}

// ============================================================================
// https://firebase.google.com/docs/firestore/server/retrieve-data
// ============================================================================

function exampleData() {
    // [START firestore_example_data]
    var citiesRef = firestore.collection('cities');

    var setSf = citiesRef.doc('SF').set({
        name: 'San Francisco', state: 'CA', country: 'USA',
        capital: false, population: 860000 });
    var setLa = citiesRef.doc('LA').set({
        name: 'Los Angeles', state: 'CA', country: 'USA',
        capital: false, population: 3900000 });
    var setDc = citiesRef.doc('DC').set({
        name: 'Washington, D.C.', state: null, country: 'USA',
        capital: true, population: 680000 });
    var setTok = citiesRef.doc('TOK').set({
        name: 'Tokyo', state: null, country: 'Japan',
        capital: true, population: 9000000 });
    var setBj = citiesRef.doc('BJ').set({
        name: 'Beijing', state: null, country: 'China',
        capital: true, population: 21500000 });
    // [END firestore_example_data]

    return Promise.all([setSf, setLa, setDc, setTok, setBj]);
}

function exampleDataTwo() {
    // [START firestore_example_data_two]
    var citiesRef = firestore.collection('cities');

    var setSf = citiesRef.doc('SF').set({
        name: 'San Francisco', state: 'CA', country: 'USA',
        capital: false, population: 860000 });
    var setLa = citiesRef.doc('LA').set({
        name: 'Los Angeles', state: 'CA', country: 'USA',
        capital: false, population: 3900000 });
    var setDc = citiesRef.doc('DC').set({
        name: 'Washington, D.C.', state: null, country: 'USA',
        capital: true, population: 680000 });
    var setTok = citiesRef.doc('TOK').set({
        name: 'Tokyo', state: null, country: 'Japan',
        capital: true, population: 9000000 });
    var setBj = citiesRef.doc('BJ').set({
        name: 'Beijing', state: null, country: 'China',
        capital: true, population: 21500000 });
    // [END firestore_example_data_two]

    return Promise.all([setSf, setLa, setDc, setTok, setBj]);
}

function getDocument() {
    // [START firestore_get_document]
    var cityRef = firestore.collection('cities').doc('SF');
    var getDoc = cityRef.get()
        .then(doc => {
            if (!doc.exists) {
                console.log('No such document!');
            } else {
                console.log('Document data:', doc.data());
            }
        })
        .catch(err => {
            console.log('Error getting document', err);
        });
    // [END firestore_get_document]

    return getDoc;
}

function getDocumentEmpty() {
    var cityRef = firestore.collection('cities').doc('Amexico');
    var getDoc = cityRef.get()
        .then(doc => {
            if (!doc.exists) {
                console.log('No such document!');
            } else {
                console.log('Document data:', doc.data());
            }
        });

    return getDoc;
}

function getMultiple() {
    // [START firestore_get_multiple]
    var citiesRef = firestore.collection('cities');
    var query = citiesRef.where('capital', '==', true).get()
        .then(snapshot => {
            snapshot.forEach(doc => {
                console.log(doc.id, '=>', doc.data());
            });
        })
        .catch(err => {
            console.log('Error getting documents', err);
        });
    // [END firestore_get_multiple]

    return query;
}

function getAll() {
    // [START firestore_get_all]
    var citiesRef = firestore.collection('cities');
    var allCities = citiesRef.get()
        .then(snapshot => {
            snapshot.forEach(doc => {
                console.log(doc.id, '=>', doc.data());
            });
        })
        .catch(err => {
            console.log('Error getting documents', err);
        });
    // [END firestore_get_all]

    return allCities;
}

// ============================================================================
// https://firebase.google.com/docs/firestore/server/query-data
// ============================================================================

function simpleQuery() {
    // [START firestore_simple_query]
    // Create a reference to the cities collection
    var citiesRef = firestore.collection('cities');

    // Create a query against the collection
    var queryRef = citiesRef.where('state', '==', 'CA');
    // [END firestore_simple_query]

    return simpleQuery.get();
}

function queryAndFilter() {
    // [START firestore_create_query]
    // Create a reference to the cities collection
    var citiesRef = firestore.collection('cities');

    // Create a query against the collection
    var queryRef = citiesRef.where('capital', '==', true);
    // [END firestore_create_query]

    // [START firestore_example_filters]
    var brazilCities = citiesRef.where('state', '==', 'CA');
    var smallCities = citiesRef.where('population', '<', 1000000);
    var afterParis = citiesRef.where('name', '>=', 'San Francisco');
    // [END firestore_example_filters]

    return Promise.all([brazilCities.get(), smallCities.get(), afterParis.get()]).then(res => {
        res.forEach(r => {
            r.forEach(d => {
                console.log('Get:', d);
            });
            console.log();
        });
    });
}

function orderAndLimit() {
    var citiesRef = firestore.collection('cities');
    // [START firestore_order_limit]
    var firstThree = citiesRef.orderBy('name').limit(3);
    // [END firestore_order_limit]

    // [START firestore_order_limit_desc]
    var lastThree = citiesRef.orderBy('name', 'desc').limit(3);
    // [END firestore_order_limit_desc]

    // [START firestore_order_multi_field]
    var byStateByPop = citiesRef.orderBy('state').orderBy('population', 'desc');
    // [END firestore_order_multi_field]

    // [START firestore_where_and_order]
    var biggest = citiesRef.where('population', '>', 2500000).orderBy('population').limit(2);
    // [END firestore_where_and_order]

    return Promise.all([firstThree.get(), lastThree.get(), biggest.get()]).then(res => {
        res.forEach(r => {
            r.forEach(d => {
                console.log('Get:', d);
            });
            console.log();
        });
    });
}

function validInvalidQueries() {
    var citiesRef = firestore.collection('cities');

    // [START firestore_valid_chained]
    citiesRef.where('state', '==', 'CO').where('name', '==', 'Denver');
    // [END firestore_valid_chained]

    // [START firestore_invalid_chained]
    citiesRef.where('state', '==', 'CA').where('population', '<', 1000000);
    // [END firestore_invalid_chained]

    // [START firestore_valid_range]
    citiesRef.where('state', '>=', 'CA').where('state', '<=', 'IN');
    citiesRef.where('state', '==', 'CA').where('population', '>', 1000000);
    // [END firestore_valid_range]

    // [START firestore_invalid_range]
    citiesRef.where('state', '>=', 'CA').where('population', '>', 1000000);
    // [END firestore_invalid_range]

    // [START firestore_valid_order_by]
    citiesRef.where('population', '>', 2500000).orderBy('population');
    // [END firestore_valid_order_by]

    // [START firestore_invalid_order_by]
    citiesRef.where('population', '>', 2500000).orderBy('country');
    // [END firestore_invalid_order_by]
}

function streamSnapshot(db, done) {
  // [START firestore_query_realtime]
  var query = firestore.collection("cities").where('state', '==', 'CA');

  var observer = query.onSnapshot(querySnapshot => {
    console.log(`Received query snapshot of size ${querySnapshot.size}`);
    // [START_EXCLUDE]
    observer();
    done();
    // [END_EXCLUDE]
  }, err => {
    console.log(`Encountered error: ${err}`);
  });
  // [END firestore_query_realtime]
}

function streamDocument(db, done) {
    // [START firestore_doc_realtime]
    var doc = firestore.collection('cities').doc('SF');

    var observer = doc.onSnapshot(docSnapshot => {
        console.log(`Received doc snapshot: ${docSnapshot}`);
        // [START_EXCLUDE]
        observer();
        done();
        // [END_EXCLUDE]
    }, err => {
        console.log(`Encountered error: ${err}`);
    });
    // [END firestore_doc_realtime]
}

function detatchListener() {
    // [START firestore_detach_listener]
    var unsub = firestore.collection('cities').onSnapshot(() => {});

    // ...

    // Stop listening for changes
    unsub();
    // [END firestore_detach_listener]
}

function listenErrors() {
    // [START firestore_listen_errors]
    firestore.collection("cities")
        .onSnapshot((snapshot) => {
            //...
        }, (error) => {
            //...
        });
    // [END firestore_listen_errors]
}

// ============================================================================
// https://firebase.google.com/docs/firestore/query-data/query-cursors
// ============================================================================

function simpleCursors() {
    // [START firestore_cursor_simple_start_at]
    var startAt = firestore.collection('cities')
        .orderBy('population')
        .startAt(1000000);
    // [END firestore_cursor_simple_start_at]

    // [START firestore_cursor_simple_end_at]
    var endAt = firestore.collection('cities')
        .orderBy('population')
        .endAt(1000000);
    // [END firestore_cursor_simple_end_at]

    return Promise.all([
        startAt.limit(10).get(),
        endAt.limit(10).get()
    ]);
}

function paginateQuery() {
    // [START firestore_cursor_paginate]
    var first = firestore.collection('cities')
        .orderBy('population')
        .limit(3);

    var paginate = first.get()
        .then((snapshot) => {
            // ...

            // Get the last document
            var last = snapshot.docs[snapshot.docs.length - 1];

            // Construct a new query starting at this document.
            // Note: this will not have the desired effect if multiple
            // cities have the exact same population value.
            var next = firestore.collection('cities')
                .orderBy('population')
                .startAfter(last.data().population)
                .limit(3);

            // Use the query for pagination
            // [START_EXCLUDE]
            return next.get().then((snapshot) => {
                console.log('Num results:', snapshot.docs.length);
            });
            // [END_EXCLUDE]
        });
    // [END firestore_cursor_paginate]

    return paginate;
}

function multipleCursorConditions() {
    // [START firestore_cursor_multiple_one_start]
    // Will return all Springfields
    var startAtName = firestore.collection("cities")
            .orderBy("name")
            .orderBy("state")
            .startAt("Springfield");
    // [END firestore_cursor_multiple_one_start]

    // [START firestore_cursor_multiple_two_start]
    // Will return "Springfield, Missouri" and "Springfield, Wisconsin"
    var startAtNameAndState = firestore.collection("cities")
            .orderBy("name")
            .orderBy("state")
            .startAt("Springfield", "Missouri");
    // [END firestore_cursor_multiple_two_start]

    return Promise.all([
        startAtName.get(),
        startAtNameAndState.get()
    ]);
}

// [START firestore_delete_collection]
function deleteCollection(collectionPath, batchSize) {
    var collectionRef = firestore.collection(collectionPath);
    var query = collectionRef.orderBy('__name__').limit(batchSize);

    return new Promise((resolve, reject) => {
        deleteQueryBatch(db, query, batchSize, resolve, reject);
    });
}

function deleteQueryBatch(query, batchSize, resolve, reject) {
    query.get()
        .then((snapshot) => {
            // When there are no documents left, we are done
            if (snapshot.size == 0) {
                return 0;
            }

            // Delete documents in a batch
            var batch = firestore.batch();
            snapshot.docs.forEach((doc) => {
                batch.delete(doc.ref);
            });

            return batch.commit().then(() => {
                return snapshot.size;
            });
        }).then((numDeleted) => {
            if (numDeleted <= batchSize) {
                resolve();
                return;
            }

            // Recurse on the next process tick, to avoid
            // exploding the stack.
            process.nextTick(() => {
                deleteQueryBatch(db, query, batchSize, resolve, reject);
            });
        })
        .catch(reject);
}
// [END firestore_delete_collection]

// ============================================================================
// MAIN
// ============================================================================

describe("Firestore Smoketests", () => {
  var db;

  before(() => { db = initializeApp(); });

  it("should get an empty document", () => {
    return getDocumentEmpty()
  });

  it("should delete existing documents", () => {
    return deleteCollection('cities', 50)
  });

  it("should store example data", () => {
    return exampleData()
  });

  it("should add quickstart data", () => {
    return quickstartAddData()
  });

  it("should query quickstart data", () => {
    return quickstartQuery()
  });

  it("should set a document", () => {
    return setDocument()
  });

  it("should manage data types", () => {
    return dataTypes()
  });

  it("should add a document", () => {
    return addDocument()
  });

  it("should add a document later", () => {
    return addLater();
  });

  it("should update a document", () => {
    return updateDocument()
  });

  it("should update many document", () => {
    return updateDocumentMany()
  });

  it("should update a missing doc", () => {
    return updateCreateIfMissing()
  });

  it("should update with server timestamp", () => {
    return updateServerTimestamp()
  });

  it("should handle transactions", () => {
    return transaction()
  });

  it("should handle transaction with a result", () => {
    return transactionWithResult().then(res => {
        // Delete data set
        return deleteCollection('cities', 50)
    });
  });

  it("should set more example data", () => {
    return exampleDataTwo()
  });

  it("should get document", () => {
    return getDocument()
  });

  it("should get multiple documents", () => {
    return getMultiple()
  });

  it("should get all documents", () => {
    return getAll()
  });

  it("should query and filter", () => {
    return queryAndFilter()
  });

  it("should order and limit", () => {
    return orderAndLimit()
  });

  it("should update and delete a field", () => {
    return updateDeleteField()
  });

  it("should update nested fields", () => {
    return updateNested();
  });

  it("should update in a batch", () => {
      updateBatch();
  });

  it("should delete doucment", () => {
    return deleteDocument()
  });

  it("should stream query data", (done) => {
    return streamSnapshot(db, done)
  });

  it("should stream doc data", (done) => {
    return streamDocument(db, done)
  });

  it("should support simple cursors", () => {
    return simpleCursors();
  });

  it("should support pagination", () => {
    return paginateQuery();
  });

  it("should support multiple cursor conditions", () => {
    return multipleCursorConditions();
  });

  it("should delete the whole collection", () => {
    return deleteCollection('cities', 50)
  });
})
