const { PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const r2 = require("../config/cloudR2");

const Lecture = require("../models/lecture");
const Video = require("../models/video");

const createLecture = async (req, res) => {

    try {

        const { title } = req.body;

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                message: "No videos uploaded"
            });
        }

        // tạo lecture
        const lecture = await Lecture.create({
            title
        });

        const uploadedVideos = [];

        for (const file of req.files) {

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

            uploadedVideos.push(video);

        }

        return res.json({
            lecture,
            videos: uploadedVideos
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Upload failed",
            error: error.message
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
            await lecture.save();
        }

        // 2️⃣ xoá video
        if (deletedVideos?.length > 0) {

            const videos = await Video.find({
                _id: { $in: deletedVideos }
            });


            for (const video of videos) {

                // xoá file trên R2
                const command = new DeleteObjectCommand({
                    Bucket: process.env.R2_BUCKET_NAME,
                    Key: video.fileName
                });

                await r2.send(command);

            }

            // xoá DB
            await Video.deleteMany({
                _id: { $in: deletedVideos }
            });

        }

        // 3️⃣ upload video mới
        const newVideos = [];

        if (req.files && req.files.length > 0) {

            for (const file of req.files) {

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
module.exports = { createLecture, getLectures, getLectureDetail, updateLecture ,deleteLecture};