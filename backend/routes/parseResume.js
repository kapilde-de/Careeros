const express = require('express');

const router = express.Router();

const multer = require('multer');

const mammoth = require('mammoth');

const pdfParse = require('pdf-parse');


// ── File Upload Setup ─────────────────

const storage = multer.memoryStorage();

const upload = multer({
  storage
});


// ── Resume Parser Route ──────────────

router.post(
  '/',
  upload.single('resume'),

  async (req, res) => {

    try {

      if (!req.file) {

        return res.status(400).json({
          error: 'No file uploaded'
        });
      }

      const file =
        req.file;

      const name =
        file.originalname.toLowerCase();

      let text = '';

      // ── DOC / DOCX ──────────────────

      if (
        name.endsWith('.docx') ||
        name.endsWith('.doc')
      ) {

        const result =
          await mammoth.extractRawText({
            buffer: file.buffer
          });

        text =
          result.value;
      }

      // ── PDF ─────────────────────────

      else if (
        name.endsWith('.pdf')
      ) {

        const data =
          await pdfParse(
            file.buffer
          );

        text =
          data.text;
      }

      // ── TXT / MD ────────────────────

      else if (
        name.endsWith('.txt') ||
        name.endsWith('.md')
      ) {

        text =
          file.buffer.toString(
            'utf-8'
          );
      }

      else {

        return res.status(400).json({
          error:
            'Unsupported file format'
        });
      }

      res.json({

        success: true,

        text:
          text.trim()
      });

    } catch (err) {

      console.error(
        'Parse Resume Error:',
        err
      );

      res.status(500).json({

        error:
          'Failed to parse resume',

        details:
          err.message
      });
    }
  }
);

module.exports = router;