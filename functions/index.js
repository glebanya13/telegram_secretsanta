const functions = require('firebase-functions');
const {Firestore} = require('@google-cloud/firestore');
const { Telegraf } = require('telegraf');
const Markup = require('telegraf/markup');

const firestore = new Firestore();

let players = [];
let player

function getData() {
firestore.collection('players').get()
.then((snapshot) => {
    snapshot.docs.forEach(doc => {
    	let player = {
    		name: doc.data().name,
    		surname:  doc.data().surname,
    		id: doc.data().id
    	}
    	players.push(player)
    });
})
.catch(function(error) {
		console.log('Error: ', error);
	})
}

getData();

function generate() {
	getData();
	var x = Math.floor(Math.random() * players.length) + 1;
	var randomPlayer = players.find((x) => x.id == x);

	player = randomPlayer
}

const bot = new Telegraf("1493834992:AAFQetYA4bgRS_frO1glgBIoSyZXTRuRywQ")
bot.start((ctx) =>
	firestore.collection('players').doc((players.length + 1).toString()).set({
		name: ctx.message.from.first_name,
		surname: ctx.message.from.last_name,
		id: (players.length + 1).toString()
	})
	.then(function() {
		ctx.reply(`Привет, ${ctx.message.from.first_name} ${ctx.message.from.last_name}!\nЯ бот, который определяет человека,\nкоторого ты должен/должна поздравить!\nСчастливого Рождества!`, Markup.keyboard([
			['Кого поздравить?']
			])
				.resize()
				.extra())
	})
	.catch(function(error) {
		console.log('Error: ', error);
	}))
bot.on('text', (ctx) => {
	// if(ctx.message === 'Кого поздравить?') {
		getData();
		var x = Math.floor(Math.random() * players.length) + 1;
		var randomPlayer = players.find((x) => x.id == x);

		ctx.reply(`Вы должны поздравить ${randomPlayer}`);
	// }else{
	// 	ctx.reply(`Количество игроков: ${players.length}`)
	// }
})
	
	
bot.launch()

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
