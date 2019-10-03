
class UserProfileMiddleware {
    validateSerialRequest(req, res, next){
        const userDetails = {}
        const {website, bio, location} = req.body;
        if(bio){
            if(bio.trim() !== '') userDetails.bio = bio;

        }
        if(website){
            if(website.trim() !== ''){
                if(!website.trim().startsWith('http') && !website.trim().startsWith('https')){
                    userDetails.website = `http://${website}`
                }
            }
        }
        if(location){
            if(location.trim() !== '') userDetails.location = location;

        }
        req.userDetails = userDetails;
        next()
    }
}

module.exports = new UserProfileMiddleware();