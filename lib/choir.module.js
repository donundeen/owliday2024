let Choir = {
    members : {},
    allChannels : [],

    init(){
        this.members = {};
        this.allChannels = [];
    },

    hasMembers(){
        console.log("hasMbmebers?", Object.keys(this.members).length)
        if(Object.keys(this.members).length > 0){
            return true;
        }
        return false;
    },

    allMembersCallback(callback){
        let memberkeys = Object.keys(this.members);
        // unset channels for all members
        for(let i = 0; i < memberkeys.length; i++){
            member = this.members[memberkeys[i]];
            callback(memberkeys[i], member);
        }        
    },

    addMember(uniqID, ip){
        this.members[ip] = {uniqID : uniqID,
                                ip: ip,
                                channels : []
        };
        console.log("add member",  this.members);
    },

    removeMember(ip){
        console.log("removing ", ip);
        delete this.members[ip];
        console.log(this.members);
    },

    distributeChannels(){
        let memberkeys = Object.keys(this.members);
        // unset channels for all members
        for(let i = 0; i < memberkeys.length; i++){
            this.members[memberkeys[i]].channels = [];
        }
        let mi = 0;
        let ci = 0;
        console.log("distributing", memberkeys, this.allChannels);
        while(ci < this.allChannels.length || mi < memberkeys.length){
            console.log("loop ", ci, mi, this.allChannels.length, memberkeys.length);
            let channel = this.allChannels[ci % this.allChannels.length];
            let member = this.members[memberkeys[mi % memberkeys.length]]
            member.channels.push(channel);
            mi++;
            ci++;
        }
        console.log("distributed" , this.members);
    }

    

}

exports.Choir = Choir;