const { PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const r2 = require("../config/cloudR2");

const Lecture = require("../models/lecture");
const Video = require("../models/video");
const Exam = require("../models/exam");
const Question = require("../models/question");
const Option = require("../models/option");
const chapter = require("../models/chapter");

const createLecture = async (req, res) => {
    try {
        const chapterId = req.params.id;
        const { title, status } = req.body;

        let thumbnailUrl = null;
        let thumbnailName = null;


        // upload thumbnail
        if (req.files?.thumbnail && req.files?.thumbnail.length > 0) {
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
            thumbnailName = fileName
        }

        // tạo lecture
        const lecture = await Lecture.create({
            title,
            thumbnail: thumbnailUrl,
            thumbnailName,
            status,
            chapterId
        });

        if (req.files.videos && req.files.videos.length > 0) {
            const videos = [];

            // upload videos
            if (req.files.videos) {

                for (const file of req.files.videos) {
                    const displayName = Buffer
                        .from(file.originalname, "latin1")
                        .toString("utf8").slice(0, -4);

                    const fileName = `videos/${Date.now()}.mp4`;

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
                        fileName,
                        displayName
                    });

                    videos.push(video);

                }

            }
            return res.json({
                lecture,
                videos
            });
        }
        return res.json({
            lecture,
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
        const chapters = await chapter.find();

        const resx = []
        for (const chapter of chapters) {
            const lectures = await Lecture.find({ chapterId: chapter._id }).sort({ createdAt: -1 });
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
            const obj = chapter.toObject();
            obj.lectures = result
            resx.push(obj)
        }
        return res.json({
            message: "Get lectures success",
            data: resx
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
        const lectures = await Lecture.find().sort({ createdAt: -1 });
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
                videos,
                lectures
            }
        });

    } catch (error) {
        res.status(500).json({
            message: "Get lecture detail failed",
            error: error.message
        });

    }

};
const updateLecture = async (req, res) => {

    try {

        const lectureId = req.params.id;
        const { title, deletedVideos, status, thumbnail } = req.body;
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
        if (status) {
            lecture.status = status;

        }
        const files = req?.files?.thumbnail
        if (files && files.length > 0) {
            // xoá file trên R2
            if (thumbnail !== 'null' && thumbnail !== 'undefined') {
                const commandDelete = new DeleteObjectCommand({
                    Bucket: process.env.R2_BUCKET_NAME,
                    Key: lecture.thumbnailName
                });
                await r2.send(commandDelete);
            }

            const file = files[0];
            const fileName = `images/${Date.now()}-${file.originalname}`;
            const command = new PutObjectCommand({
                Bucket: process.env.R2_BUCKET_NAME,
                Key: fileName,
                Body: file.buffer,
                ContentType: file.mimetype
            });
            await r2.send(command);
            const imageUrl = `${process.env.R2_PUBLIC_URL}/${fileName}`;
            // tạo lecture
            lecture.thumbnail = imageUrl
            lecture.thumbnailName = fileName
            await lecture.save();
        } else {
            if (thumbnail === 'null' || thumbnail === 'undefined') {
                if (lecture.thumbnail) {
                    const command = new DeleteObjectCommand({
                        Bucket: process.env.R2_BUCKET_NAME,
                        Key: lecture.thumbnailName
                    });
                    await r2.send(command);
                }

                lecture.thumbnail = null
                lecture.thumbnailName = null
            }

            await lecture.save();
        }

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
                const displayName = Buffer
                    .from(file.originalname, "latin1")
                    .toString("utf8").slice(0, -4);

                const fileName = `videos/${Date.now()}.mp4`;

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
                    fileName,
                    displayName
                });

                newVideos.push(video);
            }
        }

        return res.json({
            message: "Cập nhật thành công",
        });

    } catch (error) {
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

        const examId = req.params.examId;

        const exam = await Exam.findById(examId);
        const lecture = await Lecture.findOne({ _id: exam.lectureId });

        const questions = await Question.find({
            examId
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
            examId,
            lectureTitle: lecture?.title,
            totalQuestion: result.length,
            examTime: exam.timeLimit,
            examTitle: exam.title,
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
        const examId = req.params.examId;
        if (!req.file) {
            return res.status(400).json({
                message: "File JSON is required"
            });
        }
        const jsonData = JSON.parse(req.file.buffer.toString());

        const questions = jsonData.data;
        let createdQuestions = 0;

        for (const q of questions) {
            const question = await Question.create({
                examId,
                content: q.content,
                type: q.type,
            });

            const options = q.options.map(opt => ({
                questionId: question._id,
                content: opt.content,
                isCorrect: opt.isCorrect,
            }));

            await Option.insertMany(options);
            createdQuestions++;
        }

        res.json({
            message: "Import questions success",
            examId,
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

const deleteQuestionsByLecture = async (req, res) => {

  try {

    const { lectureId } = req.params;
    const lecture = await Lecture.findById(lectureId);

    if (!lecture) {
      return res.status(404).json({
        message: "Lecture not found"
      });
    }

    // ======================
    // 1. XOÁ THUMBNAIL
    // ======================
    if (lecture.thumbnailName) {
      const key = lecture.thumbnailName.replace(
        `${process.env.R2_PUBLIC_URL}/`,
        ""
      );

      await r2.send(new DeleteObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key
      }));
    }

    // ======================
    // 2. XOÁ VIDEO
    // ======================
    const videos = await Video.find({ lectureId });

    await Promise.all(
      videos.map(async (video) => {

        if (video.fileName) {

          const key = video.fileName.replace(
            `${process.env.R2_PUBLIC_URL}/`,
            ""
          );

          await r2.send(new DeleteObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: key
          }));
        }

      })
    );

    await Video.deleteMany({ lectureId });

    // ======================
    // 3. XOÁ EXAM
    // ======================
    const exams = await Exam.find({ lectureId });

    for (const exam of exams) {

      // ======================
      // 4. XOÁ QUESTION
      // ======================
      const questions = await Question.find({ examId: exam._id });

      for (const question of questions) {

        // xoá ảnh question
        if (question.fileName) {

          const key = question.fileName.replace(
            `${process.env.R2_PUBLIC_URL}/`,
            ""
          );

          await r2.send(new DeleteObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: key
          }));
        }

        // ======================
        // 5. XOÁ OPTION
        // ======================
        const options = await Option.find({
          questionId: question._id
        });

        await Promise.all(
          options.map(async (opt) => {

            if (opt.fileName) {

              const key = opt.fileName.replace(
                `${process.env.R2_PUBLIC_URL}/`,
                ""
              );

              await r2.send(new DeleteObjectCommand({
                Bucket: process.env.R2_BUCKET_NAME,
                Key: key
              }));
            }

          })
        );

        await Option.deleteMany({
          questionId: question._id
        });

      }

      await Question.deleteMany({
        examId: exam._id
      });

    }

    await Exam.deleteMany({ lectureId });

    // ======================
    // 6. XOÁ LECTURE
    // ======================
    await Lecture.findByIdAndDelete(lectureId);

    return res.json({
      message: "Delete lecture success"
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      message: "Delete lecture failed",
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
    importQuestions,
    deleteQuestionsByLecture
};