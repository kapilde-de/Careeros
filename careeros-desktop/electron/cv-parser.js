const fs = require('fs')
const path = require('path')

async function parseCV(filePath) {
  const ext = path.extname(filePath).toLowerCase()

  if (ext === '.pdf') {
    const pdfParse = require('pdf-parse')
    const buf = fs.readFileSync(filePath)
    const data = await pdfParse(buf)
    return { text: data.text.trim(), pages: data.numpages }
  }

  if (ext === '.docx' || ext === '.doc') {
    const mammoth = require('mammoth')
    const result = await mammoth.extractRawText({ path: filePath })
    return { text: result.value.trim(), pages: 1 }
  }

  if (ext === '.txt') {
    const text = fs.readFileSync(filePath, 'utf8')
    return { text: text.trim(), pages: 1 }
  }

  throw new Error(`Unsupported file type: ${ext}`)
}

module.exports = { parseCV }
