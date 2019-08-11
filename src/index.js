import {TesseractWorker} from 'tesseract.js';
import TesseractTypes from '../node_modules/tesseract.js/src/common/types.js';


const OEM = TesseractTypes.OEM, PSM = TesseractTypes.PSM;

const worker = new TesseractWorker({
    workerPath: 'dist/worker.min.js',
    langPath: './eng.traineddata.gz',
    corePath: 'dist/tesseract-core.wasm.js'
});


const numbersInput = document.getElementById('numbers');

const audio = new Audio('img/hitmarker.mp3');

document.addEventListener('click', e => {
    let message = 'Click at clientX ' + e.clientX + ', clientY ' + e.clientY;
    console.log(message);
    document.getElementById('clicked').innerHTML = message;
    document.getElementById('x').style.transform = 'translateX(' + (e.clientX) + 'px)';
    document.getElementById('y').style.transform = 'translateY(' + (e.clientY) + 'px)';
    audio.play();
});

function getClippedRegion(image, x, y, width, height) {

    let canvas = document.createElement('canvas'),
        ctx = canvas.getContext('2d');

    canvas.width = width;
    canvas.height = height;

    //                   source region         dest. region
    ctx.drawImage(image, x, y, width, height, 0, 0, width, height);

    return canvas;
}

let imgElement = document.getElementById('imageSrc'),
    inputElement = document.getElementById('fileInput');

inputElement.addEventListener('change', (e) => {
    imgElement.src = URL.createObjectURL(e.target.files[0]);
}, false);

imgElement.onload = function () {

    // Define the image size, the number of columns, rows, and the border width of the cells.
    let width = imgElement.width, height = imgElement.height,
        cols = 5, rows = 2, cells = rows * cols, border = 3, box = 80;

    // Calculate the position of each cell from the image size and the number of rows and colums.
    let digits = [];

    for (let i = 1; i <= rows; i++) {
        for (let j = 1; j <= cols; j++) {
            digits.push({
                x: Math.round(width / (cols * 2) * (j * 2 - 1)),
                y: Math.round(height / (rows * 2) * (i * 2 - 1))
            });
        }
    }

    // Split the image into each cell, discarding the border.
    let canvas = document.getElementById('split'),
        ctx = canvas.getContext('2d');

    canvas.width = box * 10;
    canvas.height = box;

    // Merge all digits in a single line.
    digits.forEach(function (digit, index) {
        digit.image = getClippedRegion(imgElement, digit.x - box / 2, digit.y - box / 2, box, box);
        ctx.drawImage(digit.image, index * box, 0);
    });

    console.log(digits);

    // OCR the line of digits.
    let result;
    worker.recognize(canvas, 'eng', {
        // Legacy mode is necessary in order to use whitelists for now.
        tessedit_ocr_engine_mode: OEM.TESSERACT_ONLY,
        tessedit_char_whitelist: '0123456789'
        // Try to use a different segmentation mode.
        , tessedit_pageseg_mode: PSM.SINGLE_LINE
    })
    //.progress(function(data){console.log(data)})
        .then(function (data) {
            result = data.text;
            console.log(result);
            document.getElementById('result').innerHTML = result;

            // Assign the numeric value to each digit object.
            digits.forEach((digit, index) => {
                digit.value = parseInt(result.substring(index, index + 1));
            });

            console.log(digits);

            // Enable the number input.
            numbersInput.disabled = false;
        });

    // Get numbers from an input.
    let rect = imgElement.getBoundingClientRect(),
        left = Math.round(rect.left), top = Math.round(rect.top)
    ;

    console.log('Image top left corner is at ' + left + ', ' + top);

    // Trigger a click event at the coordinates of each digit found.
    numbersInput.addEventListener('change', (e) => {
        let val = numbersInput.value;
        
        val.split('').forEach((int, index) => {
            let clicked = digits.find(digit => {
                return digit.value === parseInt(int);
            });
            console.log('Coordinates of the digit: ', clicked.x, clicked.y);
            let el = document.elementFromPoint(left + clicked.x, top + clicked.y);

            // Create a real MouseEvent in order to use the coordinates.
            let ev = document.createEvent('MouseEvent');
            ev.initMouseEvent(
                'click', true, true, window, null,
                0, 0, left + clicked.x, top + clicked.y,
                false, false, false, false, 0, null
            );

            // Dispatch the event on the element at the given coordinates,
            // with a delay between each click.
            setTimeout(() => el.dispatchEvent(ev), 400 * index);
        });
    }, false);
    
    // TODO Check which numbers must be entered. The full code, or only some missing numbers?
    

    // TODO Detect grid specs through OpenCV.
    // OPEN-CV TESTS
    // // Create a mat from the image.
    // let mat = cv.imread(imgElement);
    //
    // console.log('Image width: ' + imgElement.width);
    // console.log('Image height: ' + imgElement.height);
    //
    // // Switch to grayscale.
    // cv.cvtColor(mat, mat, cv.COLOR_RGBA2GRAY, 0);
    //
    // // Apply adaptative threshold.
    // cv.threshold(mat, mat, 250, 255, cv.THRESH_OTSU);
    //
    // // Display the new mat.
    // cv.imshow('canvasOutput', mat);
    //
    // let src = cv.imread(imgElement);
    // let dst = cv.Mat.zeros(src.rows, src.cols, cv.CV_8UC3);
    // let lines = new cv.Mat();
    // let color = new cv.Scalar(2,55, 0, 0);
    // cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY, 0);
    // cv.Canny(src, src, 50, 200, 3);
    // cv.HoughLinesP(src, lines, 1, Math.PI / 2, 2, 150, 15);
    // // draw lines
    // for (let i = 0; i < lines.rows; ++i) {
    //     let startPoint = new cv.Point(lines.data32S[i * 4], lines.data32S[i * 4 + 1]);
    //     let endPoint = new cv.Point(lines.data32S[i * 4 + 2], lines.data32S[i * 4 + 3]);
    //     cv.line(dst, startPoint, endPoint, color);
    // }
    // cv.imshow('lineOutput', dst);
    // src.delete();
    // dst.delete();
    // lines.delete();
};