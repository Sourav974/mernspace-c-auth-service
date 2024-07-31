import { checkSchema } from "express-validator";

export default checkSchema({
    email: {
        errorMessage: "Email is required!",
        notEmpty: true,
        trim: true,
        isEmail: true,
    },

    password: {
        trim: true,
        errorMessage: "password is required!",
        notEmpty: true,
    },
});
