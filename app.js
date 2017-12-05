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
    const endPoint = req.protocol + '://' + req.headers.host;
    let body = 'Post JSON as follows to ' + endPoint + '/upload<br><br>';
    const json = {
        "boundingBoxes": [
            { "x": 0, "y": 0, "w": 700, "h": 150 },

            { "x": 0, "y": 100, "w": 700, "h": 150 }
        ],
        "url": "https://sakkuru.github.io/Crop-and-OCR/sample_images/ibuse.png"
    }
    body += JSON.stringify(json);
    res.send(body);
});

app.post('/upload', (req, res) => {
    const boundingBoxes = req.body.boundingBoxes;
    const imageUrl = req.body.url;
    const promises = [];

    if (!boundingBoxes || !imageUrl) return;

    boundingBoxes.forEach((box, no) => {
        let croppedImageName = '';
        promises.push(
            cropImage(imageUrl, box, no).then(imageName => {
                croppedImageName = imageName;
                return getOcrResult(croppedImageName);
            }).then(res => {
                removeFile(croppedImageName);
                return res;
            })
        );
    });

    Promise.all(promises).then(ocrRes => {
        res.send(ocrRes);
    });
});

const removeFile = fileName => {
    fs.unlink(fileName, function(err) {});
}

const cropImage = (imageUrl, box, no) => {
    const croppedFileName = `images/cropped_${no}_` + imageUrl.split('/').pop();
    return new Promise((resolve, reject) => {
        Jimp.read(imageUrl).then(image => {
            return image.crop(box.x, box.y, box.w, box.h)
                .write(croppedFileName);
        }).then(() => {
            setTimeout(() => {
                resolve(__dirname + '/' + croppedFileName);
            }, 500);
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