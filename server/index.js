const fs = require('fs');

const path = require('path');
const uuid = require('uuid');

const express = require("express");
const {google} = require('googleapis');

const { initializeApp, applicationDefault, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp, FieldValue, Filter } = require('firebase-admin/firestore');


const PORT = process.env.PORT || 3000;

const app = express();
app.disable('etag');
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));



//gs://structgpt.appspot.com
const serviceAccount = require(path.join(__dirname, '../firebase-service-account.json'));
var admin = require("firebase-admin");

initializeApp({
    credential: cert(serviceAccount
      ),
    storageBucket: "structgpt.appspot.com"
});

var bucket = admin.storage().bucket();
var filename = path.join(__dirname, '../testing.txt');


const db = getFirestore();



async function writeLocalTxtFile(title , instructions) {
    const formatted_title = (title.includes(".txt") ? title : title + ".txt");
    const fp =  path.join(__dirname, '../uploaded/' + formatted_title);
    fs.writeFile(fp, instructions, 'utf8', (err) => {
        if (err) {
            throw err ///??? needed
        }
      });
    return
}


async function getFile(fileName) {

    let fileData = await bucket.getFiles({prefix: fileName})
    
    .then(results => {
        if (results.length !== 1) { return {} }
        //console.log("File data obtained, file metadata: " + results[0][0].metadata);
        console.log("getFile File Data: " + JSON.stringify(results[0][0].metadata));
        return results; 
    
    //Error response, unable to find file
    }).catch(err => {
        console.log("Error occurred: " + err);
        return {};
    });

    return fileData;
}

async function uploadFile(formatted_title) {
    const fp = path.join(__dirname, '../uploaded/' + formatted_title);
    const metadata = {
      metadata: { firebaseStorageDownloadTokens: uuid.v4() },
      contentType: 'text/plain',
      cacheControl: 'public, max-age=31536000',
    };
  
    console.log(`${formatted_title} uploading......`);
  
    await bucket.upload(fp, { gzip: true, metadata: metadata });
    
  }




async function downloadFile(fileData) {

}

async function searchForFile() {
    const snapshot = await db.collection('users').get();
}
  
// Presets/StandardProgrammingInstructionSet.txt
async function getPresetsNames() {
    
    console.log("Obtaining the name of the Presets.");

    
    const prefix =  "Presets/";
    let presetNames = []; 

    try {
        //let fileData = await bucket.getFiles({prefix: "Presets/"});
        let [fileData] = await bucket.getFiles({ prefix: prefix });
        if (fileData[0].length === 0) return ["error"];
        console.log("Preset amount: " + fileData.length);

        fileData.forEach(file => {  
             
            if (file.name !== prefix) presetNames.push( (((file.name).slice(prefix.length)).replaceAll("_", " ")).replace(".txt", ""));
        }); 

        return presetNames;

    } catch (err) { 
        console.log("Error occurred: " + err);
        return ["error"];
    } 

} 




app.post("/api/file", async (req, res) => {
    try {
      const { title, instructions } = req.body;
      const formatted_title = (title.includes(".txt") ? title : title + ".txt");
      console.log("Creating and uploading new instructions. \n" + "Title: " + title +  "\nInstructions: " +  instructions);
  
      const fp = path.join(__dirname, '../uploaded/' + formatted_title);
      await fs.writeFile(fp, instructions, 'utf8', async (err) => {
          if (err) {

            console.error('Error:', err);
            res.status(500).json({ message: 'Error processing your request' });
          } else {
            await uploadFile(formatted_title);
            res.json({ message: `File ${formatted_title} created and uploaded successfully` });
          }
       
      });
      
  
      
    } catch (err) {
        res.status(500).json({ message: 'Error processing your request' });
    }
  });


app.get("/api/file", async (req, res) => {
    
    const content = req.query.content;
    console.log("Request Query Content: " + content);

    const options = {
        destination: path.join(__dirname, '../downloaded/' + content)
    };
    
    await getFile(content)
        
        .then( async (fileData) => {
            
            if (fileData.length !== 1) { res.status(500).send("Bad request."); return; }

            
            try {
                console.log("File data obtained, file ID: " + fileData[0][0].metadata.id);
                const file = bucket.file(content);
                await file.download(options).then(downloadResponse => {
                    res.sendFile(path.join(__dirname, '../downloaded/' + content), (err) => {
                        if (err) {
                            console.error('Error sending file:', err);
                            res.status(500).send('Error sending file');
                        } else {
                            console.log('File sent successfully');
                        }
                        //console.log("File sent successfuly: " + downloadResponse);
                        //res.json({ message: `Received content: ${content}` });
                    })
                    
                });
                

            } catch (err) {
                console.log("Downloading Error Occurred - " + err);
                res.status(500).send("Error downloading file from storage.")
            }
            
            
        }); 

});


app.get("/api/preset-file", async (req, res) => {
    
    const presetName = "Presets/" + (req.query.content).replaceAll(" ", "_") + ".txt";
    console.log("Request Query Content: " + presetName);

    const options = {
        destination: path.join(__dirname, '../downloaded/' + presetName)
    };
    
    await getFile(presetName)
        
        .then( async (fileData) => {
            
            if (fileData.length !== 1) { res.status(500).send("Bad request."); return; }

            
            try {
                console.log("File data obtained, file ID: " + fileData[0][0].metadata.id);
                const file = bucket.file(presetName);
                await file.download(options).then(downloadResponse => {
                    res.sendFile(path.join(__dirname, '../downloaded/' + presetName), (err) => {
                        if (err) {
                            console.error('Error sending file:', err);
                            res.status(500).send('Error sending preset file');
                        } else {
                            console.log('Preset file sent successfully');
                        }
                        //console.log("File sent successfuly: " + downloadResponse);
                        //res.json({ message: `Received content: ${content}` });
                    })
                    //console.log("Download success: " + downloadResponse);
                   // res.json({ message: `Received content: ${presetName}` });
                });
                

            } catch (err) {
                console.log("Downloading Error Occurred - " + err);
                res.status(500).send("Error downloading file from storage.")
            }
            
            
        }); 

});



    
app.get("/api/list/presets", async (req, res) => {

    await getPresetsNames().then( results => {

        if (results[0]=="error") res.status(500).send("Error retrieving preset names.");
        
        else {

            console.log("Loaded presets: " + results); 
            res.status(200).json({message:"Received request for preset names = successful", presets: results});

        }
       
    })
});



app.get('/openapi.yaml', (req, res) => {
    res.setHeader('Content-Type', 'text/yaml');
    res.sendFile(__dirname + '/openapi.yaml'); // Assuming this file is named 'test.html'
});


app.get("/", (req, res) => {
    res.send("Hello world!")
    //console.log("req: " + req);
     // res.json({ message: "Hello from server!" });
});


app.listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}`)
})

app.get('/test', (req, res) => {
    res.sendFile(__dirname + '/test.html'); // Assuming this file is named 'test.html'
  });

