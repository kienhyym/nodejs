const { PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const r2 = require("../config/cloudR2");

const Lecture = require("../models/lecture");
const Video = require("../models/video");
const Exam = require("../models/exam");
const Question = require("../models/question");
const Option = require("../models/option");

const createLecture = async (req, res) => {

    try {

        const { title } = req.body;

        let thumbnailUrl = null;

        // upload thumbnail
        if (req.files.thumbnail) {

            const file = req.files.thumbnail[0];

            const fileName = `images/${Date.now()}-${file.originalname}`;

            const command = new PutObjectCommand({
                Bucket: process.env.R2_BUCKET_NAME,
                Key: fileName,
                Body: file.buffer,
                ContentType: file.mimetype
            });

            await r2.send(command);

            thumbnailUrl = `${process.env.R2_PUBLIC_URL}/${fileName}`;

        }

        // tạo lecture
        const lecture = await Lecture.create({
            title,
            thumbnail: thumbnailUrl
        });

        const videos = [];

        // upload videos
        if (req.files.videos) {

            for (const file of req.files.videos) {

                const fileName = `videos/${Date.now()}-${file.originalname}`;

                const command = new PutObjectCommand({
                    Bucket: process.env.R2_BUCKET_NAME,
                    Key: fileName,
                    Body: file.buffer,
                    ContentType: file.mimetype
                });

                await r2.send(command);

                const videoUrl = `${process.env.R2_PUBLIC_URL}/${fileName}`;

                const video = await Video.create({
                    lectureId: lecture._id,
                    videoUrl,
                    fileName
                });

                videos.push(video);

            }

        }

        return res.json({
            lecture,
            videos
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Create lecture failed"
        });

    }

};

const getLectures = async (req, res) => {

    try {

        const lectures = await Lecture.find().sort({ createdAt: -1 });

        const result = [];

        for (const lecture of lectures) {

            const videos = await Video.find({
                lectureId: lecture._id
            });

            result.push({
                ...lecture.toObject(),
                videos
            });

        }

        return res.json({
            message: "Get lectures success",
            data: result
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Error getting lectures"
        });

    }

};

const getLectureDetail = async (req, res) => {

    try {

        const lectureId = req.params.id;

        const lecture = await Lecture.findById(lectureId);

        if (!lecture) {
            return res.status(404).json({
                message: "Lecture not found"
            });
        }

        const videos = await Video.find({
            lectureId: lectureId
        });

        return res.json({
            message: "Get lecture detail success",
            data: {
                lecture,
                videos
            }
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Get lecture detail failed",
            error: error.message
        });

    }

};
const updateLecture = async (req, res) => {

    try {

        const lectureId = req.params.id;
        const { title, deletedVideos } = req.body;

        const lecture = await Lecture.findById(lectureId);

        if (!lecture) {
            return res.status(404).json({
                message: "Lecture not found"
            });
        }

        // 1️⃣ update title
        if (title) {
            lecture.title = title;
        }

        // 2️⃣ upload thumbnail mới
        if (req.files?.thumbnail?.length > 0) {

            const file = req.files.thumbnail[0];

            const fileName = `images/${Date.now()}-${file.originalname}`;

            const uploadCommand = new PutObjectCommand({
                Bucket: process.env.R2_BUCKET_NAME,
                Key: fileName,
                Body: file.buffer,
                ContentType: file.mimetype
            });

            await r2.send(uploadCommand);

            const thumbnailUrl = `${process.env.R2_PUBLIC_URL}/${fileName}`;

            lecture.thumbnail = thumbnailUrl;
        }

        await lecture.save();

        // 3️⃣ xoá video
        if (deletedVideos?.length > 0) {

            const videos = await Video.find({
                _id: { $in: deletedVideos }
            });

            for (const video of videos) {

                const command = new DeleteObjectCommand({
                    Bucket: process.env.R2_BUCKET_NAME,
                    Key: video.fileName
                });

                await r2.send(command);

            }

            await Video.deleteMany({
                _id: { $in: deletedVideos }
            });

        }

        // 4️⃣ upload video mới
        const newVideos = [];

        if (req.files?.videos && req.files.videos.length > 0) {

            for (const file of req.files.videos) {

                const fileName = `videos/${Date.now()}-${file.originalname}`;

                const uploadCommand = new PutObjectCommand({
                    Bucket: process.env.R2_BUCKET_NAME,
                    Key: fileName,
                    Body: file.buffer,
                    ContentType: file.mimetype
                });

                await r2.send(uploadCommand);

                const videoUrl = `${process.env.R2_PUBLIC_URL}/${fileName}`;

                const video = await Video.create({
                    lectureId,
                    videoUrl,
                    fileName
                });

                newVideos.push(video);

            }

        }

        const videos = await Video.find({
            lectureId
        });

        return res.json({
            message: "Lecture updated",
            lecture,
            videos
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Update lecture failed",
            error: error.message
        });

    }

};
const deleteLecture = async (req, res) => {

    try {

        const lectureId = req.params.id;

        const lecture = await Lecture.findById(lectureId);

        if (!lecture) {
            return res.status(404).json({
                message: "Lecture not found"
            });
        }

        // tìm tất cả video của lecture
        const videos = await Video.find({
            lectureId
        });

        // xoá file trên R2
        for (const video of videos) {

            const command = new DeleteObjectCommand({
                Bucket: process.env.R2_BUCKET_NAME,
                Key: video.fileName
            });

            await r2.send(command);

        }

        // xoá video trong DB
        await Video.deleteMany({
            lectureId
        });

        // xoá lecture
        await Lecture.findByIdAndDelete(lectureId);

        return res.json({
            message: "Lecture deleted successfully"
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Delete lecture failed",
            error: error.message
        });

    }

};
const countExamStatusByLecture = async (req, res) => {

    try {

        const lectureId = req.params.lectureId;

        const open = await Exam.countDocuments({
            lectureId,
            status: true
        });

        const closed = await Exam.countDocuments({
            lectureId,
            status: false
        });

        res.json({
            lectureId,
            open,
            closed
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Count exam failed",
            error: error.message
        });

    }

};


const getQuestionsByLecture = async (req, res) => {

    try {

        const lectureId = req.params.lectureId;

        const questions = await Question.find({
            lectureId
        }).sort({ createdAt: 1 });

        const result = [];

        for (const q of questions) {

            const options = await Option.find({
                questionId: q._id
            });

            result.push({
                _id: q._id,
                content: q.content,
                image: q.image,
                type: q.type,
                options
            });

        }

        res.json({
            lectureId,
            totalQuestion: result.length,
            questions: result
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Get questions failed",
            error: error.message
        });

    }

};
const importQuestions = async (req, res) => {

    try {

        const lectureId = req.params.lectureId;
        if (!req.file) {
            return res.status(400).json({
                message: "File JSON is required"
            });
        }
        const jsonData = JSON.parse(req.file.buffer.toString());

        const questions =  jsonData.data;
        let createdQuestions = 0;

        for (const q of questions) {
            console.log('q',q)
            const question = await Question.create({
                lectureId,
                content: q.content,
                type: q.type,
                image:q.image
            });

            const options = q.options.map(opt => ({
                questionId: question._id,
                content: opt.content,
                isCorrect: opt.isCorrect,
                image:opt.image
            }));

            await Option.insertMany(options);

            createdQuestions++;

        }

        res.json({
            message: "Import questions success",
            lectureId,
            total: createdQuestions
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Import questions failed",
            error: error.message
        });

    }

};
module.exports = {
    createLecture,
    getLectures,
    getLectureDetail,
    updateLecture,
    deleteLecture,
    countExamStatusByLecture,
    getQuestionsByLecture,
    importQuestions
};