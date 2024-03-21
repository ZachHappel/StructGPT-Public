const { Storage } = require('@google-cloud/storage');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  // ... other options like databaseURL, storageBucket, etc.
});

// Create a Google Cloud Storage client
const storage = new Storage();

// The name of the bucket
const bucketName = 'your-bucket-name'; // Replace with your actual bucket name

// The full path of the file including the folder name
const fullPathToFile = 'folder-name/file-name.ext'; // Replace with the full path to your file

// Local file path where the file should be saved
const localDestination = './local-file-name.ext'; // Replace with the path where you want the file to be saved locally

async function downloadFile(bucketName, srcFilename, destFilename) {
  const options = {
    // The path to which the file should be downloaded
    destination: destFilename,
  };

  // Downloads the file
  try {
    await storage.bucket(bucketName).file(srcFilename).download(options);
    console.log(`gs://${bucketName}/${srcFilename} downloaded to ${destFilename}.`);
  } catch (err) {
    console.error('ERROR:', err);
  }
}

// Download the file
downloadFile(bucketName, fullPathToFile, localDestination);
