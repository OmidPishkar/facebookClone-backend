import allowedOrigins from "../config/allowedOrigins.js"; 

const credential = (req , res , next) => {
    const origin = req.headers.origin;

    if(allowedOrigins.includes(origin)){
        res.header("Access-Control-Allow-Credentials" , true);
    };

    next();
}

export default credential;