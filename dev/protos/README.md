The `firestore_proto_api.d.ts` and `firestore_proto_api.js` are generated from the Firestore
protofbuf definitions. While there are certainly more proper ways of doing this, the following
process was used:

- Check out `google-proto-files` from NPM.
```
npm install --save google-proto-files
```

- Copy the `google/firestore/v1beta/*.proto` and place them in current folder.
```
cp node_modules/google-proto-files/google/firestore/v1beta1/*.proto .
```

- Remove the `google/firestore/v1beta` path from any import statements in these files.

```
sed -i '' 's/import \"google\/firestore\/v1beta1\//import \"/g' *.proto
```

- Generate the output files 
```
mkdir -p out && pbjs --proto_path node_modules/google-proto-files -t static-module -w commonjs -o out/firestore_proto_api.js firestore.proto && pbts -o out/firestore_proto_api.d.ts out/firestore_proto_api.js
```

- Edit the type used for integers greater than 2^53. The GRPC settings we use represent them as 
Strings, but pbjs uses the "Long" type.

```
sed -i '' 's/number\|Long/number\|string \"/g' firestore_proto_api.d.ts firestore_proto_api.js
```

TODO: Find a way to properly specify the proto paths for the Firestore imports so this can be automated.