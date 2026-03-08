const { PutObjectCommand } = require("@aws-sdk/client-s3");
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

module.exports = { createLecture ,getLectures};