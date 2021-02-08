const axios = require('axios');
const db = require('./db.js').db
const BOT_API_TOKEN = process.env.BOT_API;
const ch_accesskey = process.env.CH_ACCESSKEY; //coffee house access key

exports.handlePhoto = async function(photoSizes, msg) {

  //HANDLING ONLY DELNSFW FOR NOW. TODO: refactor later lol
  var dbref = db.ref('chats/'+msg.chat.id+'/isdelnsfw');
  var snapshot = await dbref.once('value');
  console.log(msg.chat.id);
  if(snapshot.exists()) {
    var val = snapshot.val();
    if(val == 'on') {
      var photo = photoSizes[0];

      var file_id = photo.file_id;

      var response = await axios.post("https://api.telegram.org/"+BOT_API_TOKEN+"/getFile",{file_id: file_id});
      var file = response.data.result;   
    //  console.log(file);
      var imagedata = await getBase64('https://api.telegram.org/file/'+BOT_API_TOKEN+'/'+file.file_path);
      //console.log(response);
      
      var FormData = require('form-data');
      //:var fs = require('fs');
      var data = new FormData();
      data.append('access_key', ch_accesskey);
      data.append('image', imagedata);
      
      var config = {
        method: 'post',
        url: 'https://api.intellivoid.net/coffeehouse/v1/image/nsfw_classification',
        headers: { 
          ...data.getHeaders()
        },
        data : data
      };
      console.log("gonna check");
      axios(config)
      .then(function (response) {
//        console.log(JSON.stringify(response.data));
        console.log(response);
        if(!response.data.success) {
          console.log(response.data);
          return;
        }
        var nsfw = response.data.results.nsfw_classification;
        console.log(nsfw);
        if(nsfw.unsafe_prediction > 85 && nsfw.is_nsfw)
          axios.post('https://api.telegram.org/'+BOT_API_TOKEN+'/deleteMessage',{chat_id: msg.chat.id, message_id: msg.message_id}).catch((e)=>{
              console.log(e);
            });
      })
      .catch(function (error) {
        console.log(error);
        console.log("ugh")
      });
    }
  }
}
function getBase64(url) {
  return axios
    .get(url, {
      responseType: 'arraybuffer'
    })
    .then(response => Buffer.from(response.data, 'binary').toString('base64'))
}
