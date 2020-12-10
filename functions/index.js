const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();
const { Firestore } = require('@google-cloud/firestore');
const { Telegraf } = require('telegraf');
const Markup = require('telegraf/markup');

const firestore = new Firestore();

var players = [];
var reminders = [];
var game = true;
var currentPlayer;
var pId;
var player; // получатель подарка

function generate(id) {
	var list = players.filter(p => p.id != id);
	currentPlayer = players.find(p => p.id == id);

	number = Math.floor(Math.random() * list.length) + 1;
	// player = list[number].name || "" + " " + list[number].surname || "";
	// pId = list[number].id;

}
// config
const bot = new Telegraf("1493834992:AAFQetYA4bgRS_frO1glgBIoSyZXTRuRywQ");

// start bot
bot.start((ctx) => {
	ctx.reply(`Привет ${ctx.message.from.first_name}!\nДля начала подбора\nнапишите команду /game\nДля начала регистрации\nнапишите команду /reg`)
})

// hello
bot.hears('Привет', (ctx) => ctx.reply(`Привет ${ctx.message.from.first_name}`));

// reg
bot.command('reg', (ctx) => {
	if (game == false) {
		ctx.reply(`К сожалению, ${ctx.message.from.first_name} ${ctx.message.from.last_name || ""},\nподбор ещё не начался:)`);
	} else {
		firestore.collection('players').doc((ctx.message.from.id).toString()).set({
			name: ctx.message.from.first_name,
			surname: ctx.message.from.last_name || "",
			x: (players.length + 1).toString(),
			id: ctx.message.from.id
		})
			.then(function () {
				ctx.reply(`Регистрация, ${ctx.message.from.first_name} ${ctx.message.from.last_name || ""},\nпрошла успешна!`, Markup.keyboard([
					['Кого поздравить?', "Напоминалка"]
				])
					.resize()
					.extra());
			})
			.catch(function (error) {
				console.log('Error: ', error);
			});
	}
});

// start game
bot.command('game', (ctx) => {
	if ('572193621' == ctx.message.from.id) { // this is my id
		game = true
		ctx.reply('Идёт подбор игроков...')
	} else {
		ctx.reply(`${ctx.message.from.first_name}, вы не можете начать игру`)
	}
})

//stop game
bot.command('stop', (ctx) => {
	if ('572193621' == ctx.message.from.id) { // this is my id
		game = false
		ctx.reply('Подбор игроков отменен:(')
	} else {
		ctx.reply(`${ctx.message.from.first_name}, вы не можете начать игру`)
	}
});

//generation text
bot.hears('Кого поздравить?', (ctx) => {
	if (game == false) {
		ctx.reply(`Ждите начала игры`);
	} else {
		generate(ctx.message.from.id);
		ctx.reply(`Вы должны поздравить ${player}`);
		firestore.collection('reminders').doc(pId).set({
			player: player,
			id: ctx.message.from.id
		});
		// firestore.collection("players").doc('124124').delete()
	}
}
);
// reminder
bot.hears('Напомилка', (ctx) => {
	var reminder = reminders.find(r => r.id == ctx.message.from.id)
	ctx.reply(`Вы должны поздравить ${reminder.player}`)
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
			console.log('good')
		});
	})
	.catch(function (error) {
		console.log('Error: ', error);
	})

exports.getReminders = admin.firestore().collection('reminders').get()
.then((snapshot) => {
	snapshot.docs.forEach(doc => {
		let data = {
			player: doc.data().player,
			id: doc.data().id
		}
		reminders.push(data);
	});
})
.catch(function (error) {
	console.log('Error: ', error);
})