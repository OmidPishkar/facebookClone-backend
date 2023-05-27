import { body } from 'express-validator';
import User from '../models/userModel.js';

const registerValidator = () => {
    return [
        body('first_name')
            .isLength({ min: 4 })
            .withMessage('first name must be least at 4 characters.'),
        
        body('last_name')
            .isLength({ min: 4 })
            .withMessage("last name must be at least 4 characters"),

        body('email')
            .isEmail()
            .withMessage('Invalid email address!')
            .custom(async (value) => {
                return User.findOne({ email: value }).then((user) => {
                  if (user) {
                    return Promise.reject("Email already in use");
                  }
                });
            }),
            

        body('password')
            .isLength({ min: 8 })
            .withMessage("password must be at least 8 characters")
            .matches(/(?=.*[0-9])(?=.*[!@#$%^&*])(?=.*[a-zA-Z])/)
            .withMessage("Passowrd must be contain string, at least on special and one numeric"),


        body('bYear')
            .not()
            .isEmpty()
            .withMessage('Bearth year can not be empty!')
            .isInt({ min: 1950 })
            .withMessage('breath year must be at least 1950!'),

        body('bMonth')
            .not()
            .isEmpty()
            .withMessage('Bearth month can not be empty!')
            .isInt({ min: 1, max: 12 })
            .withMessage('breath month must be between 1 and 12!'),

        body('bDay')
            .not()
            .isEmpty()
            .withMessage('Bearth day can not be empty!')
            .isInt({ min: 1, max: 31 })
            .withMessage('breath day must be between 1 and 31!'),

        body('gender')
            .isIn(['male', 'female', 'custom'])
            .withMessage('Gender can be male , female , custom')

    ];
}

export default registerValidator;