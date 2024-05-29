import XLSX from 'xlsx';
import path from 'path';
import { SRCCConsult } from './SRCCConsult.js';

export async function ConsultSRCCByFile(req, res) {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    const filePath = req.file.path;

    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);

    const resultData = await processData(data);

    const newWorkbook = XLSX.utils.book_new();
    const newSheet = XLSX.utils.json_to_sheet(resultData);
    XLSX.utils.book_append_sheet(newWorkbook, newSheet, 'Results');

    const currentDir = path.dirname(new URL(import.meta.url).pathname);
    const resultFilePath = path.join(currentDir, 'result.xlsx');

    await saveXLSX(currentDir, resultData);

    res.download(resultFilePath, 'result.xlsx', (err) => {
        if (err) {
            console.error(err);
            res.status(500).send('Error generating file');
        }
    });
};

async function processData(data) {
    let result = [];
    
    for (const row of data) {
        try {
            const consultedData = (padToEleven(row['CPF'])).toString();
            const consult = await SRCCConsult(consultedData);

            result.push({
                'Proposta': row['Proposta'],
                'Nome do Cliente': row['Nome do Cliente'],
                'CPF': consultedData,
                'Produto': row['Produto'],
                'Data de Envio': excelDateToFormattedDate(row['Data de Envio']),
                'Data de Retorno': excelDateToFormattedDate(row['Data de Retorno']),
                'Tipo de Impedimento': row['Tipo de Impedimento'],
                'Registro SRCC': consult.status ? 'Sim' : 'Não',
            });
        } catch (error) {
            console.error('Error processing row:', row, 'Error:', error);
        }
    };

    return result;
}

function padToEleven(numString) {
    numString = numString.toString();

    const zerosToAdd = 11 - numString.length;

    if (zerosToAdd <= 0) {
        return numString;
    }

    const zeros = '0'.repeat(zerosToAdd);

    return zeros + numString;
}

function excelDateToFormattedDate(serial) {
    const excelEpoch = new Date(1899, 11, 30);
    const days = Math.floor(serial);
    const millisecondsPerDay = 24 * 60 * 60 * 1000;
    const date = new Date(excelEpoch.getTime() + days * millisecondsPerDay);

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    const formattedDate = `${day}/${month}/${year}`;

    return formattedDate;
}

async function saveXLSX(filePath, data) {
    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, sheet, 'Verifica registro SRCC');

    try {
        await XLSX.writeFile(workbook, filePath);
        console.log('XLSX file saved successfully:', filePath);
        return true;
    } catch (error) {
        console.error('Error saving XLSX file:', error);
        return false;
    }
}