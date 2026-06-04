import mongoose from "mongoose"

const userSchema = new mongoose.Schema({
    name: {
        type: "String",
        required: "true",
        minlength: [3, 'Username must be at least 3 characters long'],
        maxlength: [50, 'Username cannot exceed 50 characters']
    },
    email: {
        type: "String",
        required: true,
        unique: "true",
        match: [/\S+@\S+\.\S+/, 'Please provide a valid email address']
    },
    password: {
        type: "String",
        required: true,
        minlength: [5, "Password must be atleast of 5 characters"],
        maxlength: [20, "Password cannot be greater than 20 characters"],
        match: [
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>_]).+$/,
            'Password must contain at least one lowercase letter, one uppercase letter, one digit, and one special character'
        ]
    },
    avater: {
        type: "String",
        default: "",
    },
    role: {
        type: "String",
        required: true,
        enum: ["user", "admin"]
    }
}, {
    timestamps: true,
});

const User = mongoose.model("user", userSchema)