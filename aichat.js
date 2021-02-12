const axios = require('axios');
const db = require('./db.js').db
      var FormData = require('form-data');
const BOT_API_TOKEN = process.env.BOT_API;
const ch_accesskey = process.env.CH_ACCESSKEY; //coffee house access key

exports.replyto = async function(msg) {

  var dbref = db.ref('chats/'+msg.chat.id+'/aichat/'+msg.chat.id+'/user/'+msg.from.id);
  var snapshot = await dbref.once('value');
  var sessionId;
  var t_res = 0;
  if(!snapshot.exists()) {
  	var response = await axios.post('https://api.intellivoid.net/coffeehouse/v1/lydia/session/create').catch((err)=>{
  		if(err.response)
  			console.log(err.response.data);
  		else console.log(err);
  	});
  	if(!response) {
  		console.log("ugh");
  		return;
  	}
  	sessionId = response.data.results.session_id;
  	var dbref = db.ref('chats/'+msg.chat.id+'/aichat/user/'+msg.from.id);
  	dbref.set({sessionId: sessionId});
  } else {
  	sessionId = snapshot.val().sessionId;
  }
  
	var data = new FormData();
	data.append('access_key', ch_accesskey);
	data.append('session_id', sessionId);
	data.append('input', msg.text);
	
	var config = {
		method: 'post',
		url: 'https://api.intellivoid.net/coffeehouse/v1/lydia/session/think',
		headers: { 
		...data.getHeaders()
		},
		data : data
	};
	var response = await axios(config).catch((err)=>{
  		if(err.response)
  			console.log(err.response.data);
  		else console.log(err);
	});
  	if(!response) {
  		console.log("ugh");
  		return;
  	}
	var output = response.data.results.output;
	
	return output;
}
