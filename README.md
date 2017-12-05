# How to use

```
git clone https://github.com/sakkuru/Trim-and-OCR.git
cd Trim-and-OCR
npm install
npm start
curl http://localhost:3000/upload -X POST -H 'Content-Type:application/json' -d '{"boundingBoxes":[{"x":0,"y":0,"w":700,"h":150}],"url":"https://sakkuru.github.io/Trim-and-OCR/sample_images/ibuse.png"}'
```