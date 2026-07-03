import multer from "multer";
import path from "path";
import fs from "fs";

// creates a folder for that file type, if it doesn't exists
const createFolder = (folder:string) => {
    if(!fs.existsSync(folder)) {
        fs.mkdirSync(folder, {recursive: true});
    }
}

const storage = multer.diskStorage({
    destination(req, file, cb) {
        let folder = "";
        if(file.mimetype.startsWith("image/")) {
            folder = "uploads/images";
        } else if (file.mimetype == "application/pdf") {
            folder = "uploads/pdfs";
        } else {
            folder = "uploads/spreadsheets";
        }

        createFolder(folder);
        cb(null, folder);
    },

    filename (req, file, cb) {
        const uniqueName = Date.now() + "-" + file.originalname;
        cb(null, uniqueName);
    }
});

// the type of files that are allowed here
const allowedTypes = [
    // for images
    "image/jpeg", "image/png", "image/webp", "image/jpg",
    // for pdf
    "application/pdf", 
    // for spreadsheets
    "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "text/csv"
];

export const upload = multer({
    storage,
    fileFilter(req, file, cb) {
        if(allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb (new Error ("Only PDF, spre3adsheet and image files are allowed"));
        }
    },
    limits: {
        fileSize: 25*1024*1024          // 25 Mb
    }
})