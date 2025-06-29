const TeamDto = require('./team-dto');
class UserDto{
    id;
    name;
    email;
    username;
    mobile;
    image;
    type;
    address;
    status;
    team;
    constructor(user)
    {
        this.id = user._id,
        this.name = user.name,
        this.username = user.username,
        this.email = user.email,
        this.mobile = user.mobile,
        this.image = user.image && `${process.env.BASE_URL}storage/${user.image}`,
        this.type = user.type && user.type.charAt(0).toUpperCase() + user.type.slice(1),
        this.address = user.address,
        this.status = user.status && user.status.charAt(0).toUpperCase()+user.status.slice(1),
        this.team = user.team && user.team.name && new TeamDto(user.team);
    }

}

module.exports = UserDto;