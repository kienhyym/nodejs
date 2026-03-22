const { PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const r2 = require("../config/cloudR2");

const Knowledge = require("../models/knowledge");

const createKnowledge = async (req, res) => {
    try {

        const { title } = req.body;
        if (req.file) {
             const file = req.file; 
            const fileName = `images/${Date.now()}-${file.originalname}`;

            const command = new PutObjectCommand({
                Bucket: process.env.R2_BUCKET_NAME,
                Key: fileName,
                Body: file.buffer,
                ContentType: file.mimetype
            });

            await r2.send(command);

            imageUrl = `${process.env.R2_PUBLIC_URL}/${fileName}`;
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
            res.status(500).json({
                message: "Create knowledge failed"
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

        console.error(error);

        res.status(500).json({
            message: "Get knowledge detail failed",
            error: error.message
        });

    }

};
const updateKnowledge = async (req, res) => {
    try {

        const knowledgeId = req.params.id;
        const { title } = req.body;
      // 4️⃣ upload video mới
        const knowledge = await Knowledge.findById(knowledgeId);

        if (!knowledge) {
            return res.status(404).json({
                message: "Knowledge not found"
            });
        }

        // 1️⃣ update title
        if (title) {
            knowledge.title = title;
        }
          // xoá file trên R2

        const command = new DeleteObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: knowledge.fileName
        });

        await r2.send(command);

        
        // 4️⃣ upload video mới
        if (req.files && req.files.image) {
             const file = req.files.image[0]; 
            const fileName = `images/${Date.now()}-${file.originalname}`;

            const uploadCommand = new PutObjectCommand({
                Bucket: process.env.R2_BUCKET_NAME,
                Key: fileName,
                Body: file.buffer,
                ContentType: file.mimetype
            });

            await r2.send(uploadCommand);

            const imageUrl = `${process.env.R2_PUBLIC_URL}/${fileName}`;

            knowledge.imageUrl = imageUrl;
            knowledge.fileName = fileName;

        }
        await knowledge.save();
        return res.json({
            message: "Knowledge updated",
            knowledge,
        });

    } catch (error) {
        console.error(error);

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

        const command = new DeleteObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: knowledge.fileName
        });

        await r2.send(command);


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


module.exports = {
    createKnowledge,
    getKnowledges,
    getKnowledgeDetail,
    updateKnowledge,
    deleteKnowledge,
};