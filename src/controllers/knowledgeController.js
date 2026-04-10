const { PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const r2 = require("../config/cloudR2");

const Knowledge = require("../models/knowledge");

const createKnowledge = async (req, res) => {
    try {

        const { title } = req.body;
        if (req?.file) {
            const file = req.file;
            let fileName = ''
            if (file.originalname.slice(-4) === ".pdf") {
                fileName = `pdfs/${Date.now()}-${file.originalname}`;
            } else {
                fileName = `images/${Date.now()}-${file.originalname}`;
            }

            const command = new PutObjectCommand({
                Bucket: process.env.R2_BUCKET_NAME,
                Key: fileName,
                Body: file.buffer,
                ContentType: file.mimetype
            });

            await r2.send(command);

            const imageUrl = `${process.env.R2_PUBLIC_URL}/${fileName}`;
            // tạo knowledge
            const knowledge = await Knowledge.create({
                title,
                imageUrl,
                fileName
            });
            return res.json({
                knowledge,
            });
        } else {
            const knowledge = await Knowledge.create({
                title,
            });
            return res.json({
                knowledge,
            });
        }
    } catch (error) {
        res.status(500).json({
            message: "Create knowledge failed"
        });

    }

};

const getKnowledges = async (req, res) => {
    try {
        const knowledgeList = await Knowledge.find().sort({ createdAt: -1 });
        console.log("🚀 ~ getKnowledges ~ knowledgeList:", knowledgeList)
        return res.json({
            message: "Get knowledges success",
            data: knowledgeList
        });

    } catch (error) {
        res.status(500).json({
            message: "Error getting knowledges"
        });

    }

};

const getKnowledgeDetail = async (req, res) => {
    try {

        const knowledgeId = req.params.id;

        const knowledge = await Knowledge.findById(knowledgeId);

        if (!knowledge) {
            return res.status(404).json({
                message: "Knowledge not found"
            });
        }
        return res.json({
            message: "Get knowledge detail success",
            data: knowledge
        });

    } catch (error) {
        res.status(500).json({
            message: "Get knowledge detail failed",
            error: error.message
        });

    }

};
const updateKnowledge = async (req, res) => {
    try {

        const knowledgeId = req.params.id;
        const { title, image } = req.body;
        const knowledge = await Knowledge.findById(knowledgeId);

        if (!knowledge) {
            return res.status(404).json({
                message: "Knowledge not found"
            });
        }

        if (title) {
            knowledge.title = title;
        }

        if (req.file) {
            // xoá file trên R2
            if (image !== 'null' && image !== 'undefined') {
                const commandDelete = new DeleteObjectCommand({
                    Bucket: process.env.R2_BUCKET_NAME,
                    Key: knowledge.fileName
                });
                await r2.send(commandDelete);
            }

            const file = req.file;

            let fileName = ''
            if (file.originalname.slice(-4) === ".pdf") {
                fileName = `pdfs/${Date.now()}-${file.originalname}`;
            } else {
                fileName = `images/${Date.now()}-${file.originalname}`;
            }

            const command = new PutObjectCommand({
                Bucket: process.env.R2_BUCKET_NAME,
                Key: fileName,
                Body: file.buffer,
                ContentType: file.mimetype
            });
            await r2.send(command);
            const imageUrl = `${process.env.R2_PUBLIC_URL}/${fileName}`;
            // tạo knowledge
            knowledge.imageUrl = imageUrl
            knowledge.fileName = fileName
            await knowledge.save();
            return res.json({
                knowledge,
            });
        } else {
            if (image === 'null' || image === 'undefined') {
                if (knowledge.imageUrl) {
                    const command = new DeleteObjectCommand({
                        Bucket: process.env.R2_BUCKET_NAME,
                        Key: knowledge.fileName
                    });
                    await r2.send(command);
                }

                knowledge.imageUrl = null
                knowledge.fileName = null
            }

            await knowledge.save();
            return res.json({
                knowledge,
            });
        }
    } catch (error) {
        res.status(500).json({
            message: "Update knowledge failed",
            error: error.message
        });

    }

};
const deleteKnowledge = async (req, res) => {

    try {

        const knowledgeId = req.params.id;

        const knowledge = await Knowledge.findById(knowledgeId);

        if (!knowledge) {
            return res.status(404).json({
                message: "Knowledge not found"
            });
        }

        // xoá file trên R2
        if (knowledge?.fileName) {
            const command = new DeleteObjectCommand({
                Bucket: process.env.R2_BUCKET_NAME,
                Key: knowledge.fileName
            });
            await r2.send(command);
        }

        // xoá knowledge
        await Knowledge.findByIdAndDelete(knowledgeId);

        return res.json({
            message: "Knowledge deleted successfully"
        });
    } catch (error) {
        res.status(500).json({
            message: "Delete knowledge failed",
            error: error.message
        });

    }

};

const getPDF = async (req, res) => {
    try {
        const knowledgeId = req.params.id;
        const knowledge = await Knowledge.findById(knowledgeId);
        const knowledgeUrl = knowledge?.imageUrl
        const response = await fetch(knowledgeUrl);
        const buffer = await response.arrayBuffer();
        res.setHeader("Content-Type", "application/pdf");
        res.send(Buffer.from(buffer));
    } catch (err) {
        res.status(500).send("Lỗi server");
    }
};



module.exports = {
    createKnowledge,
    getKnowledges,
    getKnowledgeDetail,
    updateKnowledge,
    deleteKnowledge,
    getPDF
};