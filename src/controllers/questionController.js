const Question = require("../models/question");
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const r2 = require("../config/cloudR2");

const createQuestion = async (req, res) => {

    try {

        const { examId, content, type } = req.body;

        let imageUrl = null;

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

        }

        const question = await Question.create({
            examId,
            content,
            type,
            image: imageUrl
        });

        res.json({
            message: "Create question success",
            data: question
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Create question failed",
            error: error.message
        });

    }

};

const updateQuestion = async (req, res) => {

    try {

        const questionId = req.params.id;

        const question = await Question.findById(questionId);

        if (!question) {
            return res.status(404).json({
                message: "Question not found"
            });
        }

        const { content, type } = req.body;

        if (content) question.content = content;

        if (type) question.type = type;

        if (req.file) {

            const file = req.file;

            const fileName = `question/${Date.now()}-${file.originalname}`;

            const command = new PutObjectCommand({
                Bucket: process.env.R2_BUCKET_NAME,
                Key: fileName,
                Body: file.buffer,
                ContentType: file.mimetype
            });

            await r2.send(command);

            question.image = `${process.env.R2_PUBLIC_URL}/${fileName}`;

        }

        await question.save();

        res.json({
            message: "Update question success",
            data: question
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Update question failed",
            error: error.message
        });

    }

};
const getQuestions = async (req, res) => {

    try {

        const questions = await Question.find()
            .populate("examId", "title")
            .sort({ createdAt: -1 });

        res.json({
            message: "Get questions success",
            data: questions
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Get questions failed",
            error: error.message
        });

    }

};
const Option = require("../models/option");

const getQuestionDetail = async (req, res) => {

    try {

        const questionId = req.params.id;

        const question = await Question.findById(questionId);

        if (!question) {
            return res.status(404).json({
                message: "Question not found"
            });
        }

        const options = await Option.find({
            questionId
        });

        res.json({
            question,
            options
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Get question detail failed",
            error: error.message
        });

    }

};
const deleteQuestion = async (req, res) => {

    try {

        const questionId = req.params.id;

        const question = await Question.findById(questionId);

        if (!question) {
            return res.status(404).json({
                message: "Question not found"
            });
        }

        await Option.deleteMany({
            questionId
        });

        await Question.findByIdAndDelete(questionId);

        res.json({
            message: "Delete question success"
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Delete question failed",
            error: error.message
        });

    }

};

module.exports = {
  createQuestion,
  updateQuestion,
  getQuestions,
  getQuestionDetail,
  deleteQuestion
};
