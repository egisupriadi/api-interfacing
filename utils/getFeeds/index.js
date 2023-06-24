const https = require("node:https")
const { adafruitKey, adafruitUsername } = require('../../config')
module.exports = (callback) => {
    const options = {
        hostname: "io.adafruit.com",
        path: `/api/v2/${adafruitUsername}/feeds`,
        method: "GET",
        headers: {
            "X-AIO-Key": adafruitKey,
        },
    };

    const req = https.request(options, (res) => {
        let data = "";

        res.on("data", (chunk) => {
            data += chunk;
        });

        res.on("end", () => {
            console.log("INII DATA", adafruitUsername, adafruitKey)
            let feeds = [];
            if (res.statusCode == 200) {
                feeds = JSON.parse(data)
            }
            callback(feeds?.map(({ name, last_value }) => ({ name, last_value: parseFloat(last_value || "0") })) || []);
        });
    });

    req.on("error", (error) => {
        console.error("Gagal mendapatkan daftar feeds:", error);
        callback([]);
    });

    req.end();
};