const express = require("express");
const app = express();
const firebase = require("firebase");
const mqtt = require("mqtt");
const admin = require("firebase-admin");

const {
    firebaseConfig,
    serviceAccount,
    databaseURL,
    adafruitKey,
    adafruitUsername
} = require("./config")

const {
    compareArrays,
    getFeeds,
} = require('./utils')


firebase.initializeApp(firebaseConfig);
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL,
});

const db = firebase.database();
let mqttClient, existFeeds = [], listeners = {};


const sendDataToFirebase = (feeds, data) => {
    db.ref(feeds).set(data);
    console.log("Data dikirim ke Firebase", feeds, data);
};

const unsubscribeFeeds = (feeds) => {
    if (!mqttClient) return
    existFeeds = existFeeds.filter(item => !feeds.includes(item))
    feeds.forEach(feed => {
        mqttClient.unsubscribe(feed, (err) => {
            if (err) {
                console.error(`Gagal melakukan unsubscribe dari feed ${feed}:`, err);
            } else {
                console.log(`Berhasil melakukan unsubscribe dari feed ${feed}`);
            }
        });
        if (listeners[feed]) {
            // Hapus listener dengan menggunakan referensi yang disimpan
            db.ref(feed).off("value", listeners[feed]);
            db.ref(feed).remove()
                .then(() => {
                    console.log(`Data ${feed} berhasil dihapus dari Firebase.`);
                })
                .catch((error) => {
                    console.error('Gagal menghapus data:', error);
                });

            // Hapus referensi listener
            delete listeners[feed];

            console.log(`Listener dari feed ${feed} telah dihapus`);
        } else {
            console.log(`Tidak ada listener yang terdaftar untuk feed ${feed}`);
        }

    })

};

const subscribeFeeds = (feeds = []) => {
    if (!mqttClient) return
    existFeeds = [...existFeeds, ...feeds.map(({ name }) => name)]
    feeds.forEach(({ name: feed, last_value }) => {
        mqttClient.subscribe(`${adafruitUsername}/feeds/${feed}`, (err) => {
            if (err) {
                console.error(`Gagal subscribe ke feed ${feed}`, err);
            } else {
                console.log(`Berhasil subscribe ke feed ${feed}`);
            }
        });
        listeners[feed] = db.ref(feed).on("value", (snapshot) => {
            const data = snapshot.val();
            console.log("INI DATA FIREBASE", data)
            if (data != null) {
                // Publish data ke Adafruit IO
                mqttClient.publish(
                    `${adafruitUsername}/feeds/${feed}`,
                    JSON.stringify(data)
                );
            } else {
                sendDataToFirebase(feed, last_value);//inisialisasi
            }
        });
    })
}

getFeeds((feeds = []) => {
    mqttClient = mqtt.connect("mqtt://io.adafruit.com", {
        username: adafruitUsername,
        password: adafruitKey,
        port: 1883,

    });
    mqttClient.on("connect", () => {
        console.log("Terhubung ke Adafruit IO");
        subscribeFeeds(feeds)
    });

    mqttClient.on("error", (err) => {
        if (err) {
            console.error("Error Adafruit IO", err);
        }
    })

    mqttClient.on("message", (topic, message) => {
        console.log("INI ADA DATA NIHHH", topic, message)
        const data = JSON.parse(message.toString());
        sendDataToFirebase(topic.split(`${adafruitUsername}/feeds/`).join(''), data);
    });
})

app.get('/sync/', (req, res) => {
    getFeeds((feeds) => {
        let { added, removed } = compareArrays(existFeeds, feeds.map(({ name }) => name))
        subscribeFeeds(feeds.filter(({ name }) => added.includes(name)))
        unsubscribeFeeds(removed)
        res.json({ added, removed })
    })
})

const port = 5000;
app.listen(port, () => {
    console.log(`Aplikasi berjalan di http://localhost:${port}`);
});
