import { S3 } from "aws-sdk";

export const s3 = new S3({
    accessKeyId: process.env.AWS_ACCESS_KEY!,
    secretAccessKey: process.env.AWS_SECRET_KEY!,
    endpoint: process.env.AWS_ENDPOINT!,
});

interface MyFile {
    originalname: string;
    buffer: Buffer; 
    mimetype: string;    // Optional MIME type for better handling
    
}

export const uploadFile = async (file: MyFile) => {
    const params = {
        Bucket: process.env.AWS_BUCKET_NAME!,
        Key: file.originalname,
        Body: file.buffer,
    };
    
    const res =await s3.upload(params).promise();
    return res.Location;
}