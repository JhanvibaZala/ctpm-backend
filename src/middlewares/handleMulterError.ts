import multer from "multer";

export const handleMulterError = (
    err:any,
    req:any,
    res:any,
    next:any
) => {

    if(err instanceof multer.MulterError){
        return res.status(400).json({
            success:false,
            message:err.message
        });
    }


    if(err){
        return res.status(400).json({
            success:false,
            errors:[
                {
                    field:"attachments",
                    message:err.message
                }
            ]
        });
    }


    next();
};