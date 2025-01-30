require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require("multer");
const path = require("path");
const WAHelper = require("./whatsapp.helper");

const app = express();
app.use(cors());
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));

// CONFIGURATION
const fileSize = 100 * 1024 * 1024; // 100MB
const fileTypes = /jpeg|jpg|png|mp4|mp3|m4a|aac|amr|ogg|pdf|doc|docx|xls|xlsx|ppt|pptx|txt|webp|3gp/;
const audioTypes = /mp3|m4a|aac|amr|ogg/;

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize },
    fileFilter: (req, file, cb) => {
        const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = fileTypes.test(file.mimetype);
        if (extname && mimetype) cb(null, true);
        else cb(new Error(`Only ${fileTypes.toString()} extensions are allowed!`), false);
    }
});

// UPLOAD MEDIA ROUTE (Handles Audio Processing)
app.post('/uploadMedia', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send({ message: `File is required!` });
        }

        const { originalname, size, mimetype, buffer } = req.file;
        const isAudio = audioTypes.test(path.extname(originalname).toLowerCase());

        // Create Upload Session
        let session = await WAHelper.RUCreateSession({
            file_length: size,
            file_name: originalname,
            file_type: mimetype
        });

        if (session.error) {
            console.error(session.error);
            return res.status(400).send({
                message: session.error.error_user_title 
                    ? `${session.error.error_user_title} (${session.error.error_user_msg})` 
                    : session.error.message
            });
        }

        // Initiate Upload
        let iupload = await WAHelper.RUInitiateUpload(session.id, buffer);
        if (iupload.h) {
            console.log(iupload);
            return res.status(200).send({
                message: "Uploaded!",
                body: iupload
            });
        } else if (iupload.error) {
            console.error(iupload.error);
            return res.status(400).send({
                message: iupload.error.error_user_title 
                    ? `${iupload.error.error_user_title} (${iupload.error.error_user_msg})` 
                    : iupload.error.message
            });
        } else {
            console.error(iupload);
            return res.status(400).send({ message: "Something went wrong!" });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).send({ message: "Internal server error!" });
    }
});

// CREATE TEMPLATE ROUTE
app.post('/createTemplate', async (req, res) => {
    try {
        let template = await WAHelper.createWABANOTemplates(req.body);
        if (template.id) {
            return res.status(200).send({
                message: "Template Created!",
                body: template
            });
        } else if (template.error) {
            console.error(template.error);
            return res.status(400).send({
                message: template.error.error_user_title 
                    ? `${template.error.error_user_title} (${template.error.error_user_msg})` 
                    : template.error.message
            });
        }
        console.error(template);
        return res.status(400).send({ message: "Something went wrong!" });
    } catch (error) {
        console.error(error);
        return res.status(500).send({ message: "Internal server error!" });
    }
});

// SERVER LISTEN
const port = process.env.PORT || 3000;
app.listen(port, () => console.info(`Listening on port ${port}...`))
    .on("error", (err) => console.error(err.message));
