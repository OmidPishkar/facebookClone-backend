import { body } from 'express-validator';

const authValidator = () => {
    return [
        body('email').not().isEmpty().isEmail().withMessage('Invalid Email Address.'),
        body("password").not().isEmpty().withMessage("Invalid Credentials")
    ];
}

export default authValidator;