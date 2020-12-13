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
	var list = players.filter(p => p.id !== id);
	currentPlayer = players.find(p => p.id === id);

	number = Math.floor(Math.random() * list.length) + 1;
	// player = list[number].name || "" + " " + list[number].surname || "";
	// pId = list[number].id;

}
// config
const bot = new Telegraf("1493834992:AAFQetYA4bgRS_frO1glgBIoSyZXTRuRywQ");
bot.use(Telegraf.log())

const start_kb = Markup.inlineKeyboard(
	[
		Markup.callbackButton('Да, хочу!', 'registerMe'),
		Markup.callbackButton('Нет, пока подумаю.', 'notRegisterMe')
	]
)
// start bot
bot.start((ctx) => {
	var config = functions.config()
	if (config) {
		ctx.reply(config)
	}
	const welcomMsg = "}{вала Хрысту!"
		+ `\nПривет, ${ctx.message.from.first_name} ${ctx.message.from.last_name}!`
		+ "\nЯ 👼 тайный сантабот!"
		+ "\nМы играем в Secret Santa. Это просто! Сразу регистрируются все, кто хотят участвовать."
		+ "Через несколько дней, когда все зарегистрировались, киберволшебство генерирует тебе пару. \n"
		+ "<b>Ты получаешь Имя человека, для кого ты будешь Сантой. </b>\n"
		+ "Надо приготовить небольшой подарок. Запаковать и принести в определенно место до определенной даты.\n"
		+ "Место и дату ты получишь позже."
		+ "\nХочешь быть тайным сантой? Ты с нами?"
	ctx.replyWithHTML(welcomMsg, start_kb.extra())
})

bot.action('registerMe', (ctx) => {
	ctx.reply('🙃🥳🙃🥳\nМомент...')
	return registerMe(ctx, () => {
		let from = ctx.update.callback_query.from
		ctx.reply(`${from.first_name} ${from.last_name || ""},\n 👼 рад, что ты с нами!\n Есть вопросы?`,
			Markup.keyboard([
				['Кого поздравить?', 'Куда принести?'],
				['Когда принести?', 'Покинуть игру']
			])
				.resize()
				.extra());
	}, true) // is participant = true
})


const leave_kb = Markup.inlineKeyboard(
	[
		Markup.callbackButton('Да, я ухожу!', 'notRegisterMe')
	]
)

bot.on('text', (ctx, next) => {
	switch (ctx.message.text) {
		case 'Кого поздравить?':
			ctx.reply('Минуточку...')
			whoIsMyTarget(ctx)
			break;
		case 'Куда принести?':
			ctx.reply('Пока не знаю.')
			break;
		case 'Когда принести?':
			ctx.reply('Пока не знаю.')
			break;
		case 'Покинуть игру':
			ctx.reply('Ты уверен?', leave_kb.extra())
			break;
		case 'Пока':
			ctx.reply('Бай-бай!')
			break;
		case 'Вернуться!':
			ctx.reply('Запусти команду /start')
			break;
	}
	return next()
})

bot.action('notRegisterMe', (ctx) => {
	ctx.reply('Oh! 😢😢😢')
	return registerMe(ctx, () => {
		let from = ctx.update.callback_query.from
		ctx.reply(`${from.first_name} ${from.last_name || ""},\n 👼 так жаль что ты не с нами!`,
			Markup.keyboard([
				['Пока', 'Вернуться!']
			])
				.resize()
				.extra());
	},
		false) // is not participant
})

// hello
bot.hears('Привет', (ctx) => ctx.reply(`Привет ${ctx.message.from.first_name}. Как дела?`));

// reg
bot.command('reg', (ctx) => {
	if (game === false) {
		ctx.reply(`К сожалению, ${ctx.message.from.first_name} ${ctx.message.from.last_name || ""},\nподбор ещё не начался:)`);
	} else {
		registerMe(ctx, () => {
			ctx.reply(`${ctx.message.from.first_name} ${ctx.message.from.last_name || ""},\n регистрация прошла успешна!\n есть вопросы?`,
				Markup.keyboard([
					['Кого поздравить?', 'Куда принести?'],
					['Когда принести?']
				])
					.resize()
					.extra());
		})
	}
});


const adminList = [
	'572193621', // gleb
	'935549446'	 // eshymanovich
]

// start game
bot.command('game', (ctx, next) => {
	trace(ctx)

	if (adminList.indexOf(ctx.message.from.id.toString()) !== -1) { // this is my id
		//	game = true
		ctx.reply('Идёт подбор игроков...')
		generateTargets()
	} else {
		ctx.reply(`${ctx.message.from.first_name}, вы не можете начать игру`)
	}
	return next()
})

//stop game
bot.command('stop', (ctx) => {
	if ('572193621' === ctx.message.from.id) { // this is my id
		game = false
		ctx.reply('Подбор игроков отменен:(')
	} else {
		ctx.reply(`${ctx.message.from.first_name}, вы не можете начать игру`)
	}
});

//generation text
// bot.hears('Кого поздравить?', (ctx, next) => {
// 	trace(ctx)

// 	if (game === false) {
// 		ctx.reply(`Ждите начала игры`);
// 	} else {
// 		generate(ctx.message.from.id);
// 		ctx.reply(`Вы должны поздравить ${player}`);
// 		if (pId) {
// 			firestore.collection('reminders').doc(pId).set({
// 				player: player,
// 				id: ctx.message.from.id
// 			});
// 			// firestore.collection("players").doc('124124').delete()
// 		}
// 	}
// 	return next()
// });



// reminder
// bot.hears('Напоминалка', (ctx, next) => {
// 	trace(ctx)
// 	ctx.reply('Минуточку...');
// 	var reminder = reminders.find(r => r.id === ctx.message.from.id)
// 	ctx.reply(`Вы должны поздравить ${reminder ? reminder.player : '...пока некого'}`)
// 	return next()
// }
// );

// tracing of all chats
bot.on('text', (ctx) => {
	trace(ctx);
});

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
		return players
	})
	.catch(function (error) {
		console.log('Error: ', error);
		throw error
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
		return reminders
	})
	.catch(function (error) {
		console.log('Error: ', error);
	})

exports.hw = functions.https.onRequest((req, res) => {
	res.send("Hello word")
})


// just registration
function registerMe(ctx, next, isParticipant) {
	let from = ctx.update.callback_query
		? ctx.update.callback_query.from
		: ctx.message.from

	firestore.collection('players').doc((from.id).toString()).set({
		id: from.id,
		first_name: from.first_name || '',
		last_name: from.last_name || '',
		username: from.username || '',
		isParticipant: isParticipant
	})
		.then(function (res) {
			console.log('registerMe Result', res)
			if (next) {
				return next()
			}else return res
		})
		.catch(function (error) {
			console.log('Error in Register Me: ', error);
		});
}

// find target
async function findTargetPlayer(stantaId) {
	let player = await firestore.collection('players').doc(stantaId).get();
	return player.data().target
}

async function whoIsMyTarget(ctx) {
	let target = await findTargetPlayer(ctx.message.from.id.toString())
	ctx.reply(target)
	if (target && target.id) {
		ctx.reply(`Тссс... Его зовут: ${target.first_name || ''} ${target.last_name || ''} | ${target.username || ''} \nТолько никому не говори!`)
	} else {
		ctx.reply('Пока не знаю. Игра еще не началась. Подождем всех...')
	}
}


// generation of pairs
async function generateTargets() {
	let db = await firestore.collection('players').get()
	let players = db.docs.map(d => d.data())
	if (players.length > 3) {
		let targets = players.map(p => {
			delete p.target
			return Object.assign({}, p);
		})

		players.forEach(async p => {
			if (targets.length > 0) {
				let index = chooseTarget(targets, p)
				targets.splice(index, 1)

				await firestore.collection('players').doc(p.id.toString()).update({
					target: p.target
				})
			}
		})
	}
	console.log(players.map(p => `${p.id} ${p.target.id}`)) // pairs

}

function getRandomInt(min, max) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min)) + min; //Максимум не включается, минимум включается
}

function chooseTarget(targets, p) {
	let index = getRandomInt(0, targets.length)
	let t = targets[index]

	if(p.id === t.id){
		if(targets.length === 1){
			console.log("Generation Error: we have bad pairs!!!")
			p.target = Object.assign({}, t);
			return index
		}
		return chooseTarget(targets, p)
	}

	// TODO: except logit improve
	if(p.except){
		if (p.except.indexOf(t.id) === -1) {
			p.target = Object.assign({}, t);
			return index
		} else {
			let last = targets.map(tr => tr.id)
			let difference = last.filter(x => p.except && !p.except.includes(x));
			if (difference.length > 0) {
				return chooseTarget(targets, p)
			}
			else {
				console.log("Generation Error: we have bad pairs (excepts)!!!")
				p.target = Object.assign({}, t);
				return index
			}
		}
	}else{
		p.target = Object.assign({}, t);
		return index
	}
	
}

// tracing
const traceChatList = ['935549446' // eshymanovich chat 
]

function trace(ctx) {
	traceChatList.forEach(ch =>
		ctx.telegram.sendMessage(ch,
			`Just info: ${ctx.message.from.id}|${ctx.message.from.username}|${ctx.message.from.first_name}_${ctx.message.from.last_name} sent ${ctx.message.text}`
		)
	)
}
