require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
app.use(cors());

app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));

const WAHelper = require("./whatsapp.helper");
const path = require("path");
const multer = require("multer");

// CONFIGURATION
const fileSize = 100; // 100MB (Facebook's max file size for media)
const fileTypes = /jpeg|jpg|png|mp4|mp3|m4a|aac|amr|ogg|pdf|doc|docx|xls|xlsx|ppt|pptx|txt|webp|3gp/;
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: (1024 * 1024 * fileSize) // 100 MB
    },
    fileFilter: (req, file, cb) => {
        // VALIDATE FILE EXT
        const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = fileTypes.test(file.mimetype);
        if (extname && mimetype) {
            cb(null, true);
        } else {
            cb(new Error(`Only ${fileTypes.toString()} extensions are allowed!`), false);
        }
    }
});

// UPLOAD MEDIA ROUTE
app.post('/uploadMedia', upload.single('file'), async (req, res) => {
    try {
        // FILE IS REQUIRED
        if (!req.file) {
            return res.status(400).send({
                message: `File is required!`
            });
        }

        // CREATE SESSION
        let session = await WAHelper.RUCreateSession({
            file_length: req.file.size,
            file_name: req.file.originalname,
            file_type: req.file.mimetype
        });

        if (session.body.error) {
            // LOG ERROR, AND RESPONSE
            console.error(session.body.error);
            return res.status(400).send({
                message: session.body.error.error_user_title ? session.body.error.error_user_title + ` (${session.body.error.error_user_msg})` : session.body.error.message
            });
        }

        // INITIATE UPLOAD
        let iupload = await WAHelper.RUInitiateUpload(session.body.id, req.file.buffer);
        if (iupload.body.h) {
            // SUCCESS RESPONSE
            console.log(iupload.body);
            return res.status(200).send({
                message: "Uploaded!",
                body: iupload.body
            });
        }
        // ERROR
        else if (iupload.body.error) {
            // LOG ERROR, AND RESPONSE
            console.error(iupload.body.error);
            return res.status(400).send({
                message: iupload.body.error.error_user_title ? iupload.body.error.error_user_title + ` (${iupload.body.error.error_user_msg})` : iupload.body.error.message
            });
        }
        else {
            // LOG ERROR, AND RESPONSE
            console.error(iupload);
            return res.status(400).send({
                message: "Something went wrong please try again!"
            });
        }
    } catch (error) {
        // LOG ERROR, AND RESPONSE
        console.error(error);
        return res.status(500).send({
            message: "Internal server error!"
        });
    }
});

// CREATE TEMPLATE
app.post('/createTemplate', async (req, res) => {
    try {
        let template = await WAHelper.createWABANOTemplates(req.body);
        if (template.body.id) {
            return res.status(200).send({
                message: "Template Created!",
                body: template.body
            });
        }
        // ERROR
        else if (template.body.error) {
            // LOG ERROR, AND RESPONSE
            console.error(template.body.error);
            return res.status(400).send({
                message: template.body.error.error_user_title ? template.body.error.error_user_title + ` (${template.body.error.error_user_msg})` : template.body.error.message
            });
        }
        // LOG ERROR, AND RESPONSE
        console.error(template);
        return res.status(400).send({
            message: "Something went wrong please try again!"
        });
    } catch (error) {
        // LOG ERROR, AND RESPONSE
        console.error(error);
        return res.status(500).send({
            message: "Internal server error!"
        });
    }
});

// SERVER LISTEN
const port = process.env.PORT;
app.listen(port, () => {
    console.info(`Listening on port ${port}...`)
}).on("error", (err) => {
    console.error(err.message);
});
