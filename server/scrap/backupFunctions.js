async function uploadFile(formatted_title, cb) {
    const fp =  path.join(__dirname, '../uploaded/' + formatted_title);
    const metadata = {
      metadata: {
        // This line is very important. It's to create a download token.
        firebaseStorageDownloadTokens: uuid.v4()
      },
      contentType: 'text/plain',
      cacheControl: 'public, max-age=31536000',
    };
  
    console.log(`${formatted_title} uploading......`);

    // Uploads a local file to the bucket
    await bucket.upload(fp, {
      // Support for HTTP requests made with `Accept-Encoding: gzip`
      gzip: true,
      metadata: metadata,
    });
  
    cb();   
  
}

app.post("/api/file", async (req, res) => {

    const { title, instructions } = req.body;
    const formatted_title = (title.includes(".txt") ? title : title + ".txt");
    console.log("Creating and uploading new instructions. \n" + "Title: " + title +  "\nInstructions: " +  instructions);
    res.json({ message: `File created successfully` });
    
    const fp =  path.join(__dirname, '../uploaded/' + formatted_title);
    fs.writeFile(fp, instructions, 'utf8', async (err) => {
        if (err) {
          console.error('Error writing file:', err);
          res.status(500).json({ message: 'Error writing file' });
          return;
        }
        await uploadFile(formatted_title, async () => {
            res.json({ message: `File ${formatted_title}.txt created successfully at ${fp}` });
        })
        
    })

    
    
});