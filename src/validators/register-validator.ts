import { checkSchema } from "express-validator";

export default checkSchema({
    email: {
        errorMessage: "Email is required!",
        notEmpty: true,
        trim: true,
        isEmail: true,
    },

    firstName: {
        errorMessage: "First Name is required!",
        notEmpty: true,
        trim: true,
    },

    lastName: {
        errorMessage: "Last Name is required!",
        notEmpty: true,
        trim: true,
    },

    password: {
        trim: true,
        errorMessage: "Last name is required!",
        notEmpty: true,
        isLength: {
            options: {
                min: 8,
            },
            errorMessage: "Password length should be at least 8 chars!",
        },
    },
});

// export default [body("email").notEmpty().withMessage("Email is required!")];
