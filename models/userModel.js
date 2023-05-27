import mongoose from "mongoose";
import bcrypt from 'bcrypt';
import User from '../models/userModel.js';
import Randomstring from "randomstring";

const { ObjectId } = mongoose.Schema;

const userSchema = mongoose.Schema({
    first_name: {
        type: String ,
        required: [true , 'first name is required!'],
        trim: true,
        text: true,
    },
    last_name: {
        type: String ,
        required: [true , 'last name is required!'],
        trim: true,
        text: true,
    },
    username : {
        type: String,
        required: [true , 'username is required'],
        trim: true,
        unique: true,
    },
    email: {
        type: String,
        required: [true , 'email is required']
    } ,
    password: {
        type:String,
        required: true,
    },
    picture: {
        type: String,
        trim: true,
        default: 'https://cdn3d.iconscout.com/3d/free/thumb/man-shrugging-shoulders-6560766-5438350.png'
    },
    cover: {
        type: String ,
        trim: true,
    },
    gender: {
        type: String,
        required: [true , 'gender is required'],
        trim: true
    } ,
    bYear: {
        type: Number , 
        required: true,
        trim: true
    },
    bMonth: {
        type: Number , 
        required: true,
        trim: true
    },
    bDay: {
        type: Number , 
        required: true,
        trim: true
    },
    verified: {
        type: Boolean,
        default: false
    },
    friends: {
        type: Array,
        default: [],
    },
    following: {
        type: Array,
        default: [],
    },
    followers: {
        type: Array,
        default: [],
    },
    requests: {
        type: Array,
        default: [],
    },
    search : [
        {
            user: {
                type: ObjectId,
                ref: "User"
            }
        }
    ],
    details: {
        bio: {type: String},
        otherName: {type: String},
        job: {type: String},
        workPlace: {type: String},
        highSchool: {type: String},
        collage: {type: String},
        currentCity: {type: String},
        homeTown: {type: String},
        rel: {type: String , enum: ['Single' , 'In Rel' , 'Divorced' , 'Married']},
        instagram: {type:String},
    },
    savedPosts: [
        {
            post: {
                type: ObjectId,
                ref: 'post',
            },
            savedAt: {
                type: Date,
                default: new Date()
            }
        }
    ],
    refreshToken: [String]
} , {timestamps: true});



userSchema.pre('save' , async function(next){
    let user = this;
    if( !user.isModified("password") ){
        return next();
    }

    try {
        const salt = await bcrypt.genSalt(12);
        user.password = await bcrypt.hash(user.password , salt);
        user.username = await user.generateUsername();
    
        return next();
    } catch (error) {
        return next(error);
    }
})

userSchema.methods.generateUsername = async function(){
    let user = null;
    let username = this.username;

    do {
        user = await User.findOne({username});
        if(user) username += Randomstring.generate(4);
    } while(user);

    return username;
}

userSchema.methods.comparePassword = async function(password){
    return bcrypt.compare(password , this.password);
}

export default mongoose.model("User" , userSchema);