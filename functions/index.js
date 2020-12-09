const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();
const { Firestore } = require('@google-cloud/firestore');
const { Telegraf } = require('telegraf');
const Markup = require('telegraf/markup');

const firestore = new Firestore();

let players = [];
let game = false;
gameBtn = "Начать✅";

function generate() {
	var y = Math.floor(Math.random() * players.length) + 1;
	var x = Math.floor(Math.random() * players.length) + 1;
	player = y + " " + x
	// var randomPlayer = players.find((x) => x.id == y);
	// player = randomPlayer.name + " " + randomPlayer.surname;
}
// config
const bot = new Telegraf("1493834992:AAFQetYA4bgRS_frO1glgBIoSyZXTRuRywQ");

// start bot
bot.start((ctx) => {
	if (game == true) {
		ctx.reply(`К сожалению, ${ctx.message.from.first_name} ${ctx.message.from.last_name || ""},\nвы пропустили регистрацию,\nждите следующего раза)`);
	} else {
		firestore.collection('players').doc((ctx.message.from.id).toString()).set({
			name: ctx.message.from.first_name,
			surname: ctx.message.from.last_name || "",
			x: (players.length + 1).toString(),
			id: ctx.message.from.id
		})
			.then(function () {
				ctx.reply(`Регистрация, ${ctx.message.from.first_name} ${ctx.message.from.last_name || ""},\nпрошла успешна!`, Markup.keyboard([
					['Кого поздравить?', `${gameBtn}`]
				])
					.resize()
					.extra());
			})
			.catch(function (error) {
				console.log('Error: ', error);
			})
	}
})

// hello
bot.hears('Привет', (ctx) => ctx.reply(`Привет ${ctx.message.from.first_name}`))
//start game
bot.hears(`${gameBtn}`, (ctx) => {
	if ('572193621' == ctx.message.from.id) { // this is my id
		game = !game;
		if(game==true){
			gameBtn = "Закончить⛔️";
		}else{
			gameBtn = "Начать✅";
		}
		ctx.reply(`${gameBtn}`)
	} else {
		ctx.reply(`${ctx.message.from.first_name}, вы не можете начать игру`)
	}
})

//generation text
bot.hears('Кого поздравить?', (ctx) => {
	generate();
	if (game == false) {
		ctx.reply(`Ждите начала игры`);
	} else {
		ctx.reply(`Вы должны поздравить ${player}`);
	}
}
);

bot.launch();

exports.getData = admin.firestore().collection('players').get()
	.then((snapshot) => {
		snapshot.docs.forEach(doc => {
			let player = {
				name: doc.data().name,
				surname: doc.data().surname,
				id: doc.data().id
			}
			players.push(player);
		});
	})
	.catch(function (error) {
		console.log('Error: ', error);
	})