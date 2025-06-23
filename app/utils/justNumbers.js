export default function justNumbers(text) {
    if (!text) {
        return '';
    }

    return text.replace(/[^0-9]/g, '');
}
