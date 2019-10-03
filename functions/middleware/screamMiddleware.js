

class ScreamMiddleware {
    validateComment(req,res, next){
        const {comment} = req.body;
        if(comment.trim() === '')
            return res.status(400).send({message:'Comment can not be empty'})
        next()
    }
}

module.exports = new ScreamMiddleware();