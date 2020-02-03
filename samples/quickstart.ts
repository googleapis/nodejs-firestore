import {FirebaseFirestore} from "@google-cloud/firestore";
import { Http2ServerRequest, Http2ServerResponse } from "http2";

const {Firestore} = require('@google-cloud/firestore');
const express = require('express');
// Create a new client
const firestore = new Firestore();

async function quickstart() {
  // Obtain a document reference.
  const document = firestore.doc('posts/intro-to-firestore');

  // Enter new data into the document.
  await document.set({
    title: 'Welcome to Firestore',
    body: 'Hello World',
  });
  console.log('Entered new data into the document');

  // Update an existing document.
  await document.update({
    body: 'My first Firestore app',
  });
  console.log('Updated an existing document');

  // Read the document.
  let doc = await document.get();
  console.log('Read the document');

  // Delete the document.
  // await document.delete();
  // console.log('Deleted the document');

  const bundle = firestore.bundle();
  bundle.addDoc(document);
  bundle.addQuery('restaurants', firestore.collection('restaurants'));
  const s = await bundle.stream();
  const app = express();
  app.get('/', async (req: Http2ServerRequest, res: Http2ServerResponse) => {
    for await(const d of s) {
      console.log(d);
      res.write(d);
    }
    res.end();
  });

  app.listen(43215, () => console.log('listening now...'));
}
quickstart();
