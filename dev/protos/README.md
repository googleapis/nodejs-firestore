The `firestore_proto_api.d.ts` and `firestore_proto_api.js` are generated from the Firestore
protofbuf definitions. While there are certainly more proper ways of doing this, the following
process was used:

- Check out `google-proto-files` from NPM.
```
npm install --save google-proto-files
```

- Copy the relevant proto files and place them in current folder.
```
cp node_modules/google-proto-files/google/firestore/v1beta1/*.proto . ; 
cp node_modules/google-proto-files/google/type/*.proto . ; 
cp node_modules/google-proto-files/google/protobuf/*.proto . ;
cp node_modules/google-proto-files/google/rpc/*.proto . ; 
```

- Generate the output files 

```
pbjs --proto_path=google --js_out=import_style=commonjs,binary:library --target=static --no-create --no-encode --no-decode --no-verify --no-convert --no-delimited --force-enum-string --force-number -o firestore_proto_api.js  *.proto ;
pbts -o firestore_proto_api.d.ts firestore_proto_api.js
```
