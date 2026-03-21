const Question = require("../models/question");
const { PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const r2 = require("../config/cloudR2");
const Option = require("../models/option");
const Chapter = require("../models/chapter");
const Lecture = require("../models/lecture");

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


const createQuestionWithOptions = async (req, res) => {

    try {

        const { question, type, correctAnswer } = req.body;
        const lectureId = req.params.lectureId;

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

        if (questionImageFile) {

            const fileName = `questions/${Date.now()}-${questionImageFile.originalname}`;

            await r2.send(new PutObjectCommand({
                Bucket: process.env.R2_BUCKET_NAME,
                Key: fileName,
                Body: questionImageFile.buffer,
                ContentType: questionImageFile.mimetype
            }));

            questionImageUrl = `${process.env.R2_PUBLIC_URL}/${fileName}`;

        }

        // tạo question
        const newQuestion = await Question.create({
            lectureId: lectureId,
            content: question,
            type,
            image: questionImageUrl
        });
        const createdOptions = [];
        for (const [index, item] of options.entries()) {

            const optionImageFile = req.files.find(
                f => f.fieldname === `options[${index}][image]`
            );
            let imageUrl = null;
            if (optionImageFile) {
                const fileName = `images/${Date.now()}-${optionImageFile.originalname}`;
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
                isCorrect = Number(correctAnswer) === index;
            }

            if (type === "multiple") {
                isCorrect = String(item.isCorrect) === "true";
            }

            const option = await Option.create({
                questionId: newQuestion._id,
                content: item.text,
                image: imageUrl,
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
const getQuestionDetailById = async (req, res) => {

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
            question: {
                _id: question._id,
                content: question.content,
                type: question.type,
                image: question.image
            },
            options
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            message: "Get question failed",
            error: error.message
        });

    }

};


const deleteQuestionById = async (req, res) => {

    try {

        const { id } = req.params;
        const questionId = id
        const question = await Question.findById(questionId);

        if (!question) {
            return res.status(500).json({
                message: "Question not found"
            });
        }

        // xoá ảnh question nếu có
        if (question.image) {

            const key = question.image.replace(
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

            if (opt.image) {

                const key = opt.image.replace(
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

        console.error(error);

        return res.status(500).json({
            message: "Delete question failed",
            error: error.message
        });

    }

};

const updateQuestionWithOptions = async (req, res) => {

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
            if (existingQuestion.image) {
                const existingQuestionImage = existingQuestion.image.replace(
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
            existingQuestion.image = questionImageUrl;
        }
        else {

            if (oldImage === 'null') {
                // Xoá ảnh cũ
                if (existingQuestion.image) {
                    const existingQuestionImage = existingQuestion.image.replace(
                        `${process.env.R2_PUBLIC_URL}/`,
                        ""
                    );
                    await r2.send(new DeleteObjectCommand({
                        Bucket: process.env.R2_BUCKET_NAME,
                        Key: existingQuestionImage
                    }));
                }
                existingQuestion.image = null;
            } else {
                existingQuestion.image = oldImage;
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
            if (optionImageFile) {
                const fileName = `images/${Date.now()}-${optionImageFile.originalname}`;
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
                image: imageUrl,
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
                if (opt.image && !options[index]?.oldImage) {
                    const key = opt.image.replace(
                        `${process.env.R2_PUBLIC_URL}/`,
                        ""
                    );
                    await r2.send(new DeleteObjectCommand({
                        Bucket: process.env.R2_BUCKET_NAME,
                        Key: key
                    }));
                    opt.image = null
                }

                const optionImageFileNew = req.files.find(
                    f => f.fieldname === `options[${index}][newImage]`
                );
                let imageUrlNew = null;
                if (optionImageFileNew) {
                    if (opt?.image) {
                        const key = opt.image.replace(
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
                    opt.image = imageUrlNew
                }
                await opt.save();
            } else {
                if (opt?.image) {
                    const key = opt.image.replace(
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

        console.error(error);

        res.status(500).json({
            message: "Update question failed",
            error: error.message
        });

    }

};
const getAllQuestion = async (req, res) => {

    try {
        const chapters = await Chapter.find()
        for (const chapter of chapters) {
            const lecture = await Lecture.find()
        }
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

module.exports = {
    createQuestion,
    updateQuestion,
    getQuestions,
    getQuestionDetail,
    deleteQuestion,
    createQuestionWithOptions,
    getQuestionDetailById,
    deleteQuestionById,
    updateQuestionWithOptions,
    getAllQuestion
};
