import { validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

import sendVerificationEmail from '../utilities/mailer.js';
import UserModel from '../models/userModel.js';

class UserController {
    constructor() { }

    async register(req, res) {

        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() })
            }

            const newUser = await new UserModel({
                ...req.body,
                username: req.body.first_name + req.body.last_name
            });

            newUser.username = await newUser.generateUsername();

            const mailVerificationToken = jwt.sign(
                { id: newUser._id.toString() },
                process.env.MAIN_JWT_TOKEN,
                { expiresIn: '30m' }
            )

            const url = `${process.env.BASE_URL}/activate/${mailVerificationToken}`;
            sendVerificationEmail(newUser.email, newUser.first_name, url);

            await newUser.save();

            res.json({ message: 'new user successfully created!' })

        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    async auth(req, res) {
        const cookies = req.cookies;

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;

        const foundUser = await UserModel.findOne({ email });

        if (!foundUser) {
            return res.sendStatus(401);
        }

        const matchPass = await bcrypt.compare(password, foundUser.password);

        if (!matchPass) return res.sendStatus(401);

        const accessToken = jwt.sign(
            { id: foundUser.id },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: "5m" }
        );

        const newRefreshToken = jwt.sign(
            { id: foundUser.id },
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: "15d" }
        );

        let newRefreshTokenArray = !cookies?.jwt
            ? foundUser.refreshToken
            : foundUser.refreshToken.filter((rt) => rt !== cookies.jwt);

        if (cookies?.jwt) {
            const refreshToken = cookies.jwt;
            const foundToken = await UserModel.findOne({ refreshToken });
            if (!foundToken) {
                newRefreshTokenArray = [];
            }
            res.clearCookie("jwt", {
                httpOnly: true,
                sameSite: "None",
                secure: true,
            });
        }

        foundUser.refreshToken = [...newRefreshTokenArray, newRefreshToken];

        await foundUser.save();

        res.cookie("jwt", newRefreshToken, {
            httpOnly: true,
            sameSite: "None",
            secure: true,
            maxAge: 1000 * 60 * 60 * 24 * 15,
        });

        const userInfo = {
            first_name: foundUser.first_name,
            last_name: foundUser.last_name,
            picture: foundUser.picture,
            username: foundUser.username,
            verified: foundUser.verified,
        };
        return res.json({ accessToken, userInfo });
    }

    async activateAccount(req, res) {
        const { token } = req.body;

        if (!token) return res.status(400).json({ message: "Token Not Valid" });

        jwt.verify(token, process.env.MAIN_JWT_TOKEN , async (error , user) => {
            if (error) return res.status(400).json({ message: 'Invalid Token' });

            const foundUser = await UserModel.findById(user.id);
            if (!foundUser) return res.status(400).json({ message: "Invalid Token" });
    
            if (foundUser.verified === true) {
                return res.status(400).json({ message: 'This Email Is Already Activated' })
            } else {
                await UserModel.findByIdAndUpdate(user.id, { verified: true });
                return res.status(200).json({ message: 'Account Activated Successfuly' })
            }
        });


    }

    async refreshToken(req , res){
        const cookies = req.cookies;

        if(!cookies?.jwt) return res.sendStatus(401);

        const refreshToken = cookies.jwt;

        res.clearCookie('jwt' , {
            httpOnly: true,
            sameSite: 'None',
            secure: true
        });

        const foundUser = await UserModel.findOne({refreshToken});

        if(!foundUser){
            jwt.verify(refreshToken , process.env.REFRESH_TOKEN_SECRET , async (err , decoded) => {
                if(err) return;

                const hackedUser = await UserModel.findOne({ id: decoded.id });

                hackedUser.refreshToken = [];
                await hackedUser.save();
            })

            return res.sendStatus(403);
        }

        const newRefreshTokenArray = foundUser.refreshToken.filter(rt => rt !== refreshToken);

        jwt.verify(refreshToken , process.env.REFRESH_TOKEN_SECRET , async(err,decoded) => {
            if(err){
                foundUser.refreshToken = [...newRefreshToken];
                await foundUser.save();
            };

            if( err || foundUser.id!==decoded.id ) return res.sendStatus(403);

            const accessToken = jwt.sign({id: decoded.id} , process.env.ACCESS_TOKEN_SECRET , {expiresIn: '5m'});
            const newRefreshToken = jwt.sign({id: foundUser} , process.env.REFRESH_TOKEN_SECRET , {expiresIn: '15d'});
            
            foundUser.refreshToken = [...newRefreshTokenArray , newRefreshToken];
            
            res.cookie('jwt' , newRefreshToken , {
                httpOnly: true,
                secure: true,
                sameSite: 'None',
                maxAge: 1000 * 60 * 60 * 24 * 15
            });

            res.json({accessToken});
        })
    }
}

export default new UserController();