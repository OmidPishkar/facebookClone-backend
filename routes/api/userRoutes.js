import express from "express";

import registerValidator from "../../validators/registerValidator.js";
import authValidator from '../../validators/authValidator.js';

import userController from "../../controllers/userController.js";

const Router = express.Router();

Router.post('/register' , registerValidator() , userController.register );
Router.post('/auth', authValidator() , userController.auth );
Router.post('/activate' , userController.activateAccount );

export default Router;