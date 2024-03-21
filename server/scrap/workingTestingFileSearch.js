const fs = require('fs');
const os = require('os');
const path = require('path');
const uuid = require('uuid');
const https = require('https');


const express = require("express");
const {google} = require('googleapis');
const docs = require('@googleapis/docs')
const {authenticate} = require('@google-cloud/local-auth');
const PORT = process.env.PORT || 443;

const app = express();
const drive = google.drive('v3');

const sslOptions = {
    key: fs.readFileSync(path.join(__dirname, 'server.key')),
    cert: fs.readFileSync(path.join(__dirname, 'server.cert'))
  };

async function startGoogle() {

    const auth = await authenticate({
        keyfilePath: path.join(__dirname, '../oauth.json'),
        scopes: 'https://www.googleapis.com/auth/drive',
    
      });
    
    google.options({auth});

}


async function getFile(name, cb) {
    const params = {pageSize: 3};
    params.q = "name contains '"+ name + "'"; 
    const res = await drive.files.list(params);
    console.log(res.data);
    cb(res.data);
}

async function downloadFile (fileId) {
    drive.files
    .get({fileId, alt: 'media'}, {responseType: 'stream'})
    .then(res => {
      return new Promise((resolve, reject) => {
        const filePath = path.join(os.tmpdir(), "testing.txt");
        console.log(`writing to ${filePath}`);
        const dest = fs.createWriteStream(filePath);
        let progress = 0;

        res.data
          .on('end', () => {
            console.log('Done downloading file.');
            resolve(filePath);
          })
          .on('error', err => {
            console.error('Error downloading file.');
            reject(err);
          })
          .on('data', d => {
            progress += d.length;
            if (process.stdout.isTTY) {
              process.stdout.clearLine();
              process.stdout.cursorTo(0);
              process.stdout.write(`Downloaded ${progress} bytes`);
            }
          })
          .pipe(dest);
      });
    });
}

async function getFilesInFolder(folderName) {
    const params = {pageSize: 3};
    params.q = "'"+folderName+"' in parents";
    const res = await drive.files.list(params);
    console.log(res.data);
    

}


async function testing() {
    const query  = "name contains 'testing'";
    
    const auth = await authenticate({
        keyfilePath: path.join(__dirname, '../oauth.json'),
        scopes: 'https://www.googleapis.com/auth/drive.metadata.readonly',
    
      });
    google.options({auth});

    const params = {pageSize: 3};
    params.q = query; 
    const res = await drive.files.list(params);
    console.log(res.data);

    //const authClient = await auth.getClient();


    /**
    const client = await docs.docs({
        version: 'v1',  
        auth: authClient
    });                        
    
    
  
    const createResponse = await client.documents.create({
        requestBody: {
        title: 'Your new document!',
        },                       
    },  (res) => {
        console.log(res.data);
    });     
    **/
}

app.post("/api", (req, res) => {
  console.log("req: " + req);
    res.json({ message: "Hello from server!" });
});

app.get("/api", (req, res) => {
  console.log("req: " + req);
    res.json({ message: "Hello from server!" });
});
  
https.createServer(sslOptions, app).listen(PORT, () => {    
  console.log(`Server listening on ${PORT}`);
  startGoogle()
    .then( async ()=>{
        await getFile("testing", async (res) => {
            const fileId = res.files[0].id;
            downloadFile(fileId);
        });
        
    })
    .then({
        
    })
    .catch(console.error);

});