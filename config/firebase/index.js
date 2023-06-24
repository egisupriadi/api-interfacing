const serviceAccount = require("./serviceAccountKey.json");
const firebaseConfig = {
    apiKey: "AIzaSyBqXYdfnWZ4YLofvRDOEpNJcnuQEbx5TcM",
    authDomain: "tubesiot-7f529.firebaseapp.com",
    databaseURL: "https://tubesiot-7f529-default-rtdb.firebaseio.com",
    projectId: "tubesiot-7f529",
    storageBucket: "tubesiot-7f529.appspot.com",
    messagingSenderId: "12050534628",
    appId: "1:12050534628:web:a14eccdd72d33346535cf1",
    measurementId: "G-700V7DDP73"
};
const databaseURL = "https://tubesiot-7f529-default-rtdb.firebaseio.com";
module.exports = { serviceAccount, firebaseConfig, databaseURL }