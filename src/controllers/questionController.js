const Question = require("../models/question");
const { PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const r2 = require("../config/cloudR2");
const Option = require("../models/option");
const Exam = require("../models/exam");
const Lecture = require("../models/lecture");



const createQuestion = async (req, res) => {

    try {

        const { question, type, correctAnswer } = req.body;
        const examId = req.params.examId;

        const options = req.body.options || [];
        // kiểm tra đáp án đúng
        let correctCount = 0;

        if (type === "single") {

            correctCount = options.filter((_, index) =>
                Number(correctAnswer) === index
            ).length;

        }

        if (type === "multiple") {

            correctCount = options.filter(
                opt => String(opt.isCorrect) === "true"
            ).length;

        }


        if (type === "single" && options.length < 2) {

            return res.status(500).json({
                message: "Phải có ít nhất 2 đáp án"
            });


        }

        if (correctCount === 0) {

            return res.status(500).json({
                message: "Bạn chưa chọn đáp án đúng"
            });

        }

        if (type === "single" && correctCount > 1) {

            return res.status(500).json({
                message: "Câu hỏi single chỉ được có 1 đáp án đúng"
            });

        }

        if (!question) {
            return res.status(400).json({
                message: "Question content is required"
            });
        }

        let questionImageUrl = null;

        // tìm file questionImage
        const questionImageFile = req.files.find(
            f => f.fieldname === "questionImage"
        );
        let fileNameQuestions = null
        if (questionImageFile) {

            fileNameQuestions = `images/${Date.now()}-${questionImageFile.originalname}`;

            await r2.send(new PutObjectCommand({
                Bucket: process.env.R2_BUCKET_NAME,
                Key: fileNameQuestions,
                Body: questionImageFile.buffer,
                ContentType: questionImageFile.mimetype
            }));

            questionImageUrl = `${process.env.R2_PUBLIC_URL}/${fileNameQuestions}`;

        }

        // tạo question
        const newQuestion = await Question.create({
            examId,
            content: question,
            type,
            imageUrl: questionImageUrl,
            fileName: fileNameQuestions
        });

        const createdOptions = [];
        for (const [index, item] of options.entries()) {

            const optionImageFile = req.files.find(
                f => f.fieldname === `options[${index}][imageUrl]`
            );
            let imageUrlOption = null;
            let fileNameOption = null;
            if (optionImageFile) {
                fileNameOption = `images/${Date.now()}-${optionImageFile.originalname}`;
                await r2.send(new PutObjectCommand({
                    Bucket: process.env.R2_BUCKET_NAME,
                    Key: fileNameOption,
                    Body: optionImageFile.buffer,
                    ContentType: optionImageFile.mimetype
                }));
                imageUrlOption = `${process.env.R2_PUBLIC_URL}/${fileNameOption}`;
            }
            let isCorrect = false;

            if (type === "single") {
                isCorrect = Number(correctAnswer) === index;
            }

            if (type === "multiple") {
                isCorrect = String(item.isCorrect) === "true";
            }

            const option = await Option.create({
                questionId: newQuestion._id,
                content: item.text,
                imageUrl: imageUrlOption,
                fileName: fileNameOption,
                isCorrect
            });
            createdOptions.push(option);
        }

        return res.json({
            message: "Create question success",
            question: newQuestion,
            options: createdOptions,
            status: 'ok'
        });

    } catch (error) {
        res.status(500).json({
            message: "Create question failed",
            error: error.message
        });

    }

};
const getQuestion = async (req, res) => {

    try {

        const { questionId } = req.params;

        // tìm question
        const question = await Question.findById(questionId);

        if (!question) {
            return res.status(404).json({
                message: "Question not found"
            });
        }

        // lấy options
        const options = await Option.find({
            questionId: question._id
        });

        return res.json({
            question,
            options
        });

    } catch (error) {

        return res.status(500).json({
            message: "Get question failed",
            error: error.message
        });

    }

};


const deleteQuestion = async (req, res) => {

    try {

        const { questionId } = req.params;
        const question = await Question.findById(questionId);
        if (!question) {
            return res.status(500).json({
                message: "Question not found"
            });
        }

        // xoá ảnh question nếu có
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

        // lấy options
        const options = await Option.find({
            questionId
        });

        if (!options) {
            return res.json({
                message: "Delete question success",
                status: true
            });

        }

        // xoá ảnh option
        for (const opt of options) {

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

        }

        // xoá options
        await Option.deleteMany({
            questionId
        });

        // xoá question
        await Question.findByIdAndDelete(questionId);

        return res.json({
            message: "Delete question success",
            status: true
        });

    } catch (error) {
        return res.status(500).json({
            message: "Delete question failed",
            error: error.message
        });

    }

};

const updateQuestion = async (req, res) => {
    try {
        const { questionId } = req.params;
        const { question, type, correctAnswer, oldImage } = req.body;
        const options = req.body.options || [];
        // kiểm tra đáp án đúng
        let correctCount = 0;

        if (type === "single") {

            correctCount = options.filter((_, index) =>
                Number(correctAnswer) === index
            ).length;

        }

        if (type === "multiple") {

            correctCount = options.filter(
                opt => String(opt.isCorrect) === "true"
            ).length;

        }

        if (correctCount === 0) {
            return res.status(500).json({
                message: "Bạn chưa chọn đáp án đúng"
            });

        }

        if (type === "single" && correctCount > 1) {
            return res.status(500).json({
                message: "Câu hỏi single chỉ được có 1 đáp án đúng"
            });

        }
        // kiểm  tra question
        const existingQuestion = await Question.findById(questionId);
        // kiểm tra tồn question tồn tại
        if (!existingQuestion) {
            return res.status(500).json({
                message: "Question not found"
            });
        }

        existingQuestion.content = question;
        existingQuestion.type = type;

        // Kiểm tra hình ảnh 
        let questionImageUrl = null;

        // tìm file questionImage
        const questionImageFile = req.files.find(
            f => f.fieldname === "questionImage"
        );

        // Thêm ảnh mới
        if (questionImageFile) {
            // Xoá ảnh cũ
            if (existingQuestion.fileName) {
                const existingQuestionImage = existingQuestion.fileName.replace(
                    `${process.env.R2_PUBLIC_URL}/`,
                    ""
                );
                await r2.send(new DeleteObjectCommand({
                    Bucket: process.env.R2_BUCKET_NAME,
                    Key: existingQuestionImage
                }));

            }
            const fileName = `images/${Date.now()}-${questionImageFile.originalname}`;
            await r2.send(new PutObjectCommand({
                Bucket: process.env.R2_BUCKET_NAME,
                Key: fileName,
                Body: questionImageFile.buffer,
                ContentType: questionImageFile.mimetype
            }));
            questionImageUrl = `${process.env.R2_PUBLIC_URL}/${fileName}`;
            existingQuestion.imageUrl = questionImageUrl;
            existingQuestion.fileName = fileName;
        }
        else {
            if (oldImage === 'null') {
                // Xoá ảnh cũ
                if (existingQuestion.fileName) {
                    const existingQuestionImage = existingQuestion.fileName.replace(
                        `${process.env.R2_PUBLIC_URL}/`,
                        ""
                    );
                    await r2.send(new DeleteObjectCommand({
                        Bucket: process.env.R2_BUCKET_NAME,
                        Key: existingQuestionImage
                    }));
                }
                existingQuestion.imageUrl = null;
                existingQuestion.fileName = null;

            } else {
                existingQuestion.imageUrl = oldImage;
            }
        }
        await existingQuestion.save();
        //############################


        // lấy option cũ
        const oldOptions = await Option.find({ questionId });
        const optionsNoId = options
            .map((item, index) => ({ ...item, index }))
            .filter(item => !item._id);

        for (const item of optionsNoId) {
            const optionImageFile = req.files.find(
                f => f.fieldname === `options[${item.index}][newImage]`
            );
            let imageUrl = null;
            let fileName = null;
            if (optionImageFile) {
                fileName = `images/${Date.now()}-${optionImageFile.originalname}`;
                await r2.send(new PutObjectCommand({
                    Bucket: process.env.R2_BUCKET_NAME,
                    Key: fileName,
                    Body: optionImageFile.buffer,
                    ContentType: optionImageFile.mimetype
                }));
                imageUrl = `${process.env.R2_PUBLIC_URL}/${fileName}`;
            }
            let isCorrect = false;

            if (type === "single") {
                isCorrect = Number(correctAnswer) === item.index;
            }

            if (type === "multiple") {
                isCorrect = String(item.isCorrect) === "true";
            }

            const option = await Option.create({
                questionId,
                content: item.content,
                imageUrl,
                fileName,
                isCorrect: isCorrect
            });
        }

        for (const opt of oldOptions) {
            const index = options.findIndex(item => item?._id?.toString() === opt?._id?.toString());
            if (index !== -1) {

                let isCorrect = false;

                if (type === "single") {
                    isCorrect = Number(correctAnswer) === index;
                }

                if (type === "multiple") {
                    isCorrect = String(options[index].isCorrect) === "true";
                }

                opt.isCorrect = isCorrect
                opt.content = options[index].content
                if (opt.imageUrl && !options[index]?.oldImage) {
                    const key = opt.imageUrl.replace(
                        `${process.env.R2_PUBLIC_URL}/`,
                        ""
                    );
                    await r2.send(new DeleteObjectCommand({
                        Bucket: process.env.R2_BUCKET_NAME,
                        Key: key
                    }));
                    opt.imageUrl = null
                }

                const optionImageFileNew = req.files.find(
                    f => f.fieldname === `options[${index}][newImage]`
                );
                let imageUrlNew = null;
                if (optionImageFileNew) {
                    if (opt?.fileName) {
                        const key = opt.fileName.replace(
                            `${process.env.R2_PUBLIC_URL}/`,
                            ""
                        );
                        await r2.send(new DeleteObjectCommand({
                            Bucket: process.env.R2_BUCKET_NAME,
                            Key: key
                        }));
                    }
                    const fileName = `images/${Date.now()}-${optionImageFileNew.originalname}`;
                    await r2.send(new PutObjectCommand({
                        Bucket: process.env.R2_BUCKET_NAME,
                        Key: fileName,
                        Body: optionImageFileNew.buffer,
                        ContentType: optionImageFileNew.mimetype
                    }));
                    imageUrlNew = `${process.env.R2_PUBLIC_URL}/${fileName}`;
                    opt.imageUrl = imageUrlNew
                }
                await opt.save();
            } else {
                if (opt?.fileName) {
                    const key = opt.fileName.replace(
                        `${process.env.R2_PUBLIC_URL}/`,
                        ""
                    );
                    await r2.send(new DeleteObjectCommand({
                        Bucket: process.env.R2_BUCKET_NAME,
                        Key: key
                    }));
                }
                await Option.findByIdAndDelete(opt._id);
            }
        }
        return res.json({
            message: "Update question success",
            status: "ok"
        });

    } catch (error) {
        res.status(500).json({
            message: "Update question failed",
            error: error.message
        });
    }
};

const getQuestions = async (req, res) => {

    try {

        const examId = req.params.examId;
        const exam = await Exam.findById(examId);
        const lecture = await Lecture.findOne({ _id: exam.lectureId });
        const questions = await Question.find({ examId }).sort({ createdAt: 1 });
        res.json({
            message: "OK",
            data: {
                lectureTitle: lecture?.title,
                examTitle: exam?.title,
                questions
            }
        });
    } catch (error) {
        res.status(500).json({
            message: "Get questions failed",
            error: error.message
        });
    }
};

module.exports = {
    createQuestion,
    getQuestion,
    getQuestions,
    deleteQuestion,
    updateQuestion,
};
