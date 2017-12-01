require('dotenv').config();
const Jimp = require("jimp");
const fs = require('fs');
const request = require('request');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const port = process.env.port || process.env.PORT || 3000;
const server = app.listen(port, () => {
    console.log('App is listening on port %s', port);
});

app.get('/', (req, res) => {
    res.send('App is running.');
});

app.post('/', (req, res) => {
    const boundingBoxes = req.body.boundingBoxes;
    const imageUrl = req.body.url;
    const promises = [];

    console.log(imageUrl, boundingBoxes);
    if (!boundingBoxes || !imageUrl) return;

    boundingBoxes.forEach((box, no) => {
        promises.push(cropImage(imageUrl, box, no).then(res => {
            console.log('res', res)
            return getOcrResult(res);
        }));
    });
    Promise.all(promises).then(ocrRes => {
        res.send(ocrRes);
    });
});

const cropImage = (imageUrl, box, no) => {
    const croppedFileName = `cropped_${no}_` + imageUrl.split('/').pop();
    console.log(croppedFileName);
    return new Promise((resolve, reject) => {
        Jimp.read(imageUrl).then(image => {
            image.crop(box.x, box.y, box.w, box.h)
                .write(croppedFileName);
            resolve(__dirname + '/' + croppedFileName);
        }).catch((err) => {
            console.error(err);
        });
    });
}

const getOcrResult = (imageFileName) => {
    return new Promise((resolve, reject) => {
        const apiEndpoint = process.env.COMPUTER_VISION_ENDPOINT || 'https://southeastasia.api.cognitive.microsoft.com/vision/v1.0/ocr';
        const params = {
            language: 'ja',
            detectOrientation: true,
        };
        fs.readFile(imageFileName, (err, data) => {
            console.log(data)
            const options = {
                url: apiEndpoint,
                qs: params,
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/octet-stream',
                    'Ocp-Apim-Subscription-Key': process.env.SUBSCRIPTION_KEY,
                },
                body: data
            };

            request.post(options, (error, response, body) => {
                if (error) {
                    console.log('Image Recognition Error: ', error);
                } else {
                    resolve(JSON.parse(body));
                }
            });
        });

    });
}