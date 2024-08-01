import Jimp from 'jimp';
import { Command } from 'commander';
import fs from 'fs';
import path from 'path';

const program = new Command();

program
    .option('-i, --input <filename>', 'input image filename')
    .parse(process.argv);

const options = program.opts();

if (!options.input) {
    console.error('Error: Input file is required.');
    process.exit(1);
}

const inputFilePath = options.input;

if (!fs.existsSync(inputFilePath)) {
    console.error('Error: Input file does not exist.');
    process.exit(1);
}

const generateOutputFilename = (inputFilename: string): string => {
    const ext = path.extname(inputFilename);
    const baseName = path.basename(inputFilename, ext);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `${baseName}_${timestamp}${ext}`;
};

const outputFilePath = generateOutputFilename(inputFilePath);

(async () => {
    try {
        const img = await Jimp.read(inputFilePath);

        const imageWidth = img.getWidth();
        const imageHeight = img.getHeight();

        const offsetXStart = 0;

        const steps = 128;
        const pixelatedMax = 35;

        const outImage = new Jimp(imageWidth, imageHeight, 0x00000000);

        outImage.composite(img, 0, 0);

        for (let step = 1; step <= steps; step++) {
            const stepOffset = offsetXStart + (imageWidth - offsetXStart) / steps * (step - 1);
            const widthStep = imageWidth - stepOffset;
            const pixelateAmount = Math.floor((step / steps) * pixelatedMax);
            const pixelatedStep = img.clone()
                .crop(stepOffset, 0, widthStep, imageHeight - 1)
                .pixelate(pixelateAmount > 0 ? pixelateAmount : 1);
            outImage.composite(pixelatedStep, stepOffset, 0);
        }

        await outImage.writeAsync(outputFilePath);
        console.log(`Output image saved as ${outputFilePath}`);
    } catch (error: any) {
        console.error(`Error processing image: ${error.message}`);
    }
})();
