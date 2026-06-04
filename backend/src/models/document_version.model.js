import mongoose from "mongoose";

const documentVersionSchema = new mongoose.Schema({
    ducument: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Document",
        required: true,
    },
    versionNumber: {
        type: Number,
        required: true,
    },
    snapshot : {
        type: Buffer
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    message: {
        type: String,
        default: "Auto saved version"
    },
}, {
    timestamps: true
});

const DocumentVetsion = mongoose.model("documentVersions", documentVersionSchema);