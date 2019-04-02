# App-data

A simple data persistence layer for applications

<br>

## Basic usage

```javascript
const appdata = require('@potentii/app-data');


/* 
 * Setting the application name:
 *  This will be the directory name where 
 *  the data will be saved on.
 */
appdata.setAppName('My app');


/*
 * An example of data to be saved:
 */
const userPreferences = {
    mode: 'dark'
};


/*
 * Saving the data:
 *  You can use any file extension here as the key.
 *  The data can be an object or an array.
 */
appdata.save('preferences.json', userPreferences)
    .then(() => {
        console.log('User preferences successfully saved!');
    
        
        /*
         * Retrieving the data:
         *  The returned data will be converted to an object.
         *  For arrays, use the 'appdata.getArray' function instead.
         */
        appdata.get('preferences.json')
            .then(data => console.log('mode: ' + data.mode)); // mode: dark
    });
```

<br>

## Directories

The default persistence directory will vary depending on the OS:

- Windows: `C:\Users\<username>\AppData\Roaming\<appname>`

<br>

## License
[MIT](LICENSE)
