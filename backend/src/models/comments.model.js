import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
    document: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Document",
        required: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    comment : {
        type: String
    },
    blockId: {
        type: String
    },
    resolved:{
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

const Comment = mongoose.Schema("comments", commentSchema);