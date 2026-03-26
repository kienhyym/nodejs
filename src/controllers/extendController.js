const { PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const r2 = require("../config/cloudR2");

const Extend = require("../models/extend");

const createExtend = async (req, res) => {
    try {
        const { title, link } = req.body;
        if (req?.file) {
            const file = req.file;
            const fileName = `images/${Date.now()}-${file.originalname}`;
            const command = new PutObjectCommand({
                Bucket: process.env.R2_BUCKET_NAME,
                Key: fileName,
                Body: file.buffer,
                ContentType: file.mimetype
            });
            await r2.send(command);
            const imageUrl = `${process.env.R2_PUBLIC_URL}/${fileName}`;
            // tạo extend
            const extend = await Extend.create({
                title,
                link,
                imageUrl,
                imageName: fileName
            });
            return res.json({
                extend,
            });
        } else {
            const extend = await Extend.create({
                title,
                link,
            });
            return res.json({
                extend,
            });
        }
    } catch (error) {
        res.status(500).json({
            message: "Create extend failed"
        });

    }

};

const getExtends = async (req, res) => {
    try {
        const extendList = await Extend.find().sort({ createdAt: -1 });
        return res.json({
            message: "Get extends success",
            data: extendList
        });

    } catch (error) {
        res.status(500).json({
            message: "Error getting extends"
        });

    }

};

const getExtendDetail = async (req, res) => {
    try {

        const extendId = req.params.id;

        const extend = await Extend.findById(extendId);

        if (!extend) {
            return res.status(404).json({
                message: "Extend not found"
            });
        }
        return res.json({
            message: "Get extend detail success",
            data: extend
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Get extend detail failed",
            error: error.message
        });

    }

};
const updateExtend = async (req, res) => {
    try {

        const extendId = req.params.id;
        const { title, link, image } = req.body;

        const extend = await Extend.findById(extendId);

        if (!extend) {
            return res.status(404).json({
                message: "Extend not found"
            });
        }

        // 1️⃣ update title
        if (title) {
            extend.title = title;
        }
        if (link) {
            extend.link = link;
        }

        if (req.file) {

            // xoá file trên R2
            if (image !== 'null') {
                const commandDelete = new DeleteObjectCommand({
                    Bucket: process.env.R2_BUCKET_NAME,
                    Key: extend.imageName
                });
                await r2.send(commandDelete);
            }

            const file = req.file;
            const fileName = `images/${Date.now()}-${file.originalname}`;
            const command = new PutObjectCommand({
                Bucket: process.env.R2_BUCKET_NAME,
                Key: fileName,
                Body: file.buffer,
                ContentType: file.mimetype
            });
            await r2.send(command);
            const imageUrl = `${process.env.R2_PUBLIC_URL}/${fileName}`;
            // tạo extend
            extend.imageUrl = imageUrl
            extend.imageName = fileName
            await extend.save();
            return res.json({
                extend,
            });
        } else {
            if (image === 'null') {
                if (extend.imageUrl) {
                    const command = new DeleteObjectCommand({
                        Bucket: process.env.R2_BUCKET_NAME,
                        Key: extend.imageName
                    });
                    await r2.send(command);
                }

                extend.imageUrl = null
                extend.imageName = null
            }

            await extend.save();
            return res.json({
                extend,
            });
        }
    } catch (error) {
        res.status(500).json({
            message: "Update extend failed",
            error: error.message
        });

    }

};
const deleteExtend = async (req, res) => {

    try {

        const extendId = req.params.id;

        const extend = await Extend.findById(extendId);

        if (!extend) {
            return res.status(404).json({
                message: "Extend not found"
            });
        }

        // xoá file trên R2
        if (extend.imageName) {
            const command = new DeleteObjectCommand({
                Bucket: process.env.R2_BUCKET_NAME,
                Key: extend.imageName
            });
            await r2.send(command);
        }

        // xoá extend
        await Extend.findByIdAndDelete(extendId);

        return res.json({
            message: "Extend deleted successfully"
        });
    } catch (error) {
        res.status(500).json({
            message: "Delete extend failed",
            error: error.message
        });

    }

};


module.exports = {
    createExtend,
    getExtends,
    getExtendDetail,
    updateExtend,
    deleteExtend,
};