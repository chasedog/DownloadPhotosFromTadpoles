/**
 * Downloads photos from any daycare facility that uses Tadpoles into your Google Drive
 *
 * @param {string} the email subject of the daily report, e.g. 'Daily Report for Carter'
 * @param {string} the url of the Tadpoles server, e.g. 'mybrightday.brighthorizons.com'
 * @param {string} [googleDriveFolderName=null] Optional, Google Drive folder name which will be prefixed with the date, e.g. 'Carter' -> '2021-4-1 Carter'
 * If not given, will extract the last word (probably your child's name) from the first parameter ; 
 * 
 */
function uploadPhotos(emailSubject, domainName, googleDriveFolderName = null) {
  if (!emailSubject) {
    throw new Error('"emailSubject" not set; set to Daily Report for [Child\'s name]');
  }
  if (!domainName) {
    throw new Error('"domain" not set, it should be the full URI, e.g. mybrightday.brighthorizons.com');
  }

  if (!googleDriveFolderName) {
    googleDriveFolderName = emailSubject.split(' ').pop();
  }
  const date = new Date(); 
  const day = date.getDay();
  if (day === 0 || day === 6)
    return;
  const formattedDate = Utilities.formatDate(date, 'PST', "yyyy-M-d");
  Logger.log(`Looking for photos in date ${formattedDate}`);

  const seachParameter = `"${emailSubject}" after:${formattedDate}`;
  const email = GmailApp.search(seachParameter)[0];
   if (!email) {
    throw new Error(`Could not find any emails matching ${seachParameter}`);
  } 
  uploadPhotoToDrive_(email, `${formattedDate} ${googleDriveFolderName}`, domainName);
}

function uploadPhotoToDrive_(email, folderName, domainName) {
  const folder = findOrCreateFolder(folderName);
  const message = email.getMessages()[0];
  const regex = new RegExp(`"https://${domainName}([/\\w]+)"`, 'g');
  Logger.log(`Looking for messages using ${regex.toString()}`);

  const all = Array.from(message.getBody().matchAll(regex));
  all.forEach(r => {
    const uri = `https://${domainName}${r[1]}?d=t`;
    const image = UrlFetchApp.fetch(uri).getBlob();

    folder.createFile(image);
  });
}

function findOrCreateFolder_(name) {
  const folders = DriveApp.getFoldersByName(name);
  if (folders.hasNext()) {
    return folders.next();
  }
  return DriveApp.createFolder(name);
}
