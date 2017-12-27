const packageInfo   = require('./index.js');

packageInfo('com.rormix.apk', (err, data) => {
  console.log(data);
});