import mongoose from "mongoose";

const documentSchema = new mongoose.Schema({
    title : {
        type: String,
        default: "Untitled String",
        maxlength: [250, "Maximum length is 250 characters"],
        minlength: [5, "Minimum length is 5 characters"]
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    contentSnapshot: {
        type: Buffer,
    },
    plainText: {
        type: String,
        default: "",
    },
    collaborators: {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        permissions: {
            type: String,
            enum: ["viewer", "owner", "editor", "commentor"],
            default: "viewer"
        }
    },
    isDeleted: {
        type: Boolean,
        default: false,
    },
    lastEditedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    lastEditedAt: {
        type: Date,
        required: true,
    },
}, {
    timestamps: true
});

const document = mongoose.model("documents", documentSchema);