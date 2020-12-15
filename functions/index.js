const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();
const { Firestore } = require('@google-cloud/firestore');
const { Telegraf } = require('telegraf');
const Markup = require('telegraf/markup');
const session = require('telegraf/session')

const firestore = new Firestore();

// config
const bot = new Telegraf("1493834992:AAFQetYA4bgRS_frO1glgBIoSyZXTRuRywQ");
bot.use(Telegraf.log())
bot.use(session())

const start_kb = Markup.inlineKeyboard(
	[
		Markup.callbackButton('Да, хочу!', 'registerMe'),
		Markup.callbackButton('Нет, пока подумаю.', 'notRegisterMe')
	]
)
// start bot
bot.start((ctx) => {
	var config = functions.config()
	if (config && config.game) {
		// it works
		// to set game start firebase functions:config:set game.state="started"
		//ctx.reply(config)
	}
	const welcomMsg = "}{вала Хрысту!"

		+ `\nПривет, ${ctx.message.from.first_name} ${ctx.message.from.last_name}!`
		+ "\nЯ 👼 тайный сантабот!"
		+ "\nМы играем в Secret Santa. Это просто! Сразу регистрируются все, кто хотят участвовать.\n"
		+ "<i>Закрытие регистрации <b>18 декабря</b></i> \n"
		+ "Через несколько дней, когда все зарегистрировались, киберволшебство генерирует тебе пару. \n"
		+ "<b>Ты получаешь Имя человека, для кого ты будешь Сантой. </b>\n"
		+ "Надо приготовить небольшой подарок (скажем, ценой до 10 руб). Запаковать, подписать и принести в определенно место <i>до 22 декабря.</i>\n"
		+ "Место и дату ты получишь позже."
		+ "\nХочешь быть тайным сантой? Ты с нами?"
	ctx.replyWithHTML(welcomMsg, start_kb.extra())
	loadPlayers(ctx)
})


bot.action('registerMe', (ctx) => {
	ctx.reply('🙃🥳🙃🥳\nМомент...')
	return registerMe(ctx, () => {
		let from = ctx.update.callback_query.from
		ctx.reply(`${from.first_name} ${from.last_name || ""},\n 👼 рад, что ты с нами!\n Есть вопросы?`,
			Markup.keyboard([
				['Кого поздравить?', 'Куда принести?'],
				['Когда принести?', 'Кто еще здесь?'],
				['Покинуть игру']
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
			ctx.reply("Пока не знаю.")
			ctx.replyWithHTML('Надо купить подарок (недорогой, допустим до 10 руб). Место сбора подарков скажу позже.')
			break;
		case 'Когда принести?':
			ctx.replyWithHTML('Надо купить подарок (недорогой, допустим до 10 руб). <i>Красиво</i> упаковать и <i>подписать</i>. \n<b>До 22 декабря</b> подарок должен быть готов. Место сбора подарков будет указанно позже.')
			break;
		case 'Покинуть игру':
			ctx.reply('Ты уверен?', leave_kb.extra())
			break;
		case 'Кто еще здесь?':
			ctx.reply('Нас много!')
			listPlayers(ctx)
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
		return generateTargets(ctx, next)
	} else {
		ctx.reply(`${ctx.message.from.first_name}, вы не можете начать игру`)
	}
	return next()
})

bot.command('hello', ctx => ctx.reply('hello')) // test comand - hello
bot.command('getaphotos', (ctx, next) => { // GetAllPhotos command 
	ctx.reply('working to find all photos')
	return showPhotos(ctx, next)
})
bot.command('help', ctx => ctx.reply("Привет 👼! \nВсе просто. \n/start - для того чтобы присоединиться. \nКак только присоединился - появятся кнопки. Вот и все."))
//stop game
bot.command('stop', (ctx) => {
	if ('572193621' === ctx.message.from.id) { // this is my id
		ctx.reply('Подбор игроков отменен:(')
	} else {
		ctx.reply(`${ctx.message.from.first_name}, вы не можете начать игру`)
	}
});

bot.on('text', (ctx) => {
	trace(ctx);
});

bot.launch();


exports.stanta = functions.https.onRequest(
	(req, res) => bot.handleUpdate(req.body, res)
)
//bot.telegram.setWebhook(`https://us-central1-secretsanta-234fc.cloudfunctions.net/stanta/AAFQetYA4bgRS`);
// https://api.telegram.org/bot1493834992:AAFQetYA4bgRS_frO1glgBIoSyZXTRuRywQ/getMe
// https://api.telegram.org/bot1493834992:AAFQetYA4bgRS_frO1glgBIoSyZXTRuRywQ/setWebhook?url=https://us-central1-secretsanta-234fc.cloudfunctions.net/stanta
// https://api.telegram.org/bot1493834992:AAFQetYA4bgRS_frO1glgBIoSyZXTRuRywQ/getWebhookInfo


function loadPlayers(ctx, next) {
	return admin.firestore().collection('players').get()
		.then((snapshot) => {
			ctx.session.players = [...snapshot.docs.map(d => d.data())]
			if (next) return next()
			else
				return ctx.session.players
		})
		.catch(error => {
			logError(ctx, error)
			console.log('Error loadPlayers: ', error)
		})
}

function listPlayers(ctx) {
	if (ctx.session.players && ctx.session.players.length > 0) {
		ctx.session.players.filter(p => p.isParticipant).forEach(p => ctx.reply(`${p.first_name || ''}_${p.last_name || ''}`))
	} else {
		ctx.reply("Таак... под рукой списка нет. Счас сбегаю в базу...")
		loadPlayers(ctx, () => {
			listPlayers(ctx)
		})
	}
}

// just registration
function registerMe(ctx, next, isParticipant) {
	let from = ctx.update.callback_query
		? ctx.update.callback_query.from
		: ctx.message.from
	let currentPlayer = {
		id: from.id,
		first_name: from.first_name || '',
		last_name: from.last_name || '',
		username: from.username || '',
		isParticipant: isParticipant
	}
	let players = ctx.session.players

	if (players && players.length > 0) {
		let findResultIndex = players.findIndex(f => f.id === currentPlayer.id)
		if (findResultIndex !== -1) {
			players[findResultIndex].isParticipant = isParticipant
		} else {
			players.push(currentPlayer)
		}
		ctx.reply("Готово!")
	}

	firestore.collection('players').doc((from.id).toString()).set(currentPlayer)
		.then(function (res) {
			//console.log('registerMe Result', res)
			if (next) {
				return next()
			} else return res
		})
		.catch(function (error) {
			logError(ctx, error)
			console.log('Error in Register Me: ', error);
		});
}

// find target
// function findTargetPlayer(santaId, ctx, next) {
// 	return firestore.collection('players').doc(santaId).get().then(player => {
// 		if(next){
// 			next(player && player.target)
// 		}else return player && player.target
// 	}).catch(error => {
// 		logError(ctx, error)
// 		console.log('', error)
// 		if(next) next()
// 	});
// }

function whoIsMyTarget(ctx) {
	let target = {}
	let players = ctx.session.players
	//target = {id: "1173843019"} // to test on Angelina Chat ID
	if (players && players.length > 0) {
		let player = players.find(f => f.id === ctx.message.from.id)
		if (player && player.target) {
			sendTargetInfo(ctx,target)
		}else{
			ctx.reply('Пока не знаю. Игра еще не началась. Подождем всех...')
		}
	} else {
		ctx.reply("Таак... под рукой списка нет. Счас сбегаю в базу...")
		loadPlayers(ctx, () => whoIsMyTarget(ctx))
		//findTargetPlayer(ctx.message.from.id.toString())
	}

	
}

function sendTargetInfo(ctx, target){
	if (target && target.id) {
		ctx.reply(`Тссс... Его зовут: ${target.first_name || ''} ${target.last_name || ''} | ${target.username || ''} \nТолько никому не говори!`)
		ctx.reply('Хмм... И где-то было фото... Если найду, пришлю.')
		showPhotosOfUser(ctx, ctx.message.from.id, target.id) // 
	}
}

// generation of pairs
async function generateTargets(ctx, next) {
	let db = await firestore.collection('players').get()
	ctx.session.players = db.docs.map(d => d.data())
	let players = ctx.session.players
	let participants = players // players.filter(p => p.isParticipant)
	if (participants.length > 3) {
		let targets = participants.map(p => {
			delete p.target
			return Object.assign({}, p);
		})

		participants.forEach(async p => {
			if (targets.length > 0) {
				let index = chooseTarget(targets, p)
				targets.splice(index, 1)

				await firestore.collection('players').doc(p.id.toString()).update({
					target: p.target
				})
			}
		})
	}
	participants.map(p => `[${p.id} ${p.first_name}_${p.last_name} -> ${p.target.id} ${p.target.first_name}_${p.target.last_name}]`).forEach(m => ctx.reply(m))
	console.log(participants.map(p => `${p.id} ${p.target.id}`)) // pairs
	if (next) return next()
	else return "ok"
}

function getRandomInt(min, max) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min)) + min; //Максимум не включается, минимум включается
}

function chooseTarget(targets, p) {
	let index = getRandomInt(0, targets.length)
	let t = targets[index]

	if (p.id === t.id) {
		if (targets.length === 1) {
			console.log("Generation Error: we have bad pairs!!!")
			p.target = Object.assign({}, t);
			return index
		}
		return chooseTarget(targets, p)
	}

	// TODO: except logit improve
	if (p.except) {
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
	} else {
		p.target = Object.assign({}, t);
		return index
	}

}

// tracing
const traceChatList = ['935549446' // eshymanovich chat 
]
const warningChatList = ['935549446' // eshymanovich chat 
]

function trace(ctx) {
	traceChatList.forEach(ch =>
		ctx.telegram.sendMessage(ch,
			`Just info: ${ctx.message.from.id}|${ctx.message.from.username}|${ctx.message.from.first_name}_${ctx.message.from.last_name} sent ${ctx.message.text}`
		)
	)
}

function logError(ctx, error) {
	warningChatList.forEach(ch => ctx.telegram.sendMessage(ch, error))
}

function showPhotos(ctx, next) {
	let players = ctx.session.players
	if (players && players.length > 0) {

		traceChatList.forEach(ch => {

			players.forEach(async p => {
				//ctx.telegram.sendMessage(ch, `Avas of ${p.first_name}`)
				let photo = await ctx.telegram.getUserProfilePhotos(p.id, 0, 0)
				photo.photos.forEach(arph => {

					if (arph && arph.length > 0) {
						console.log(`Avas of ${p.first_name}`, arph)
						arph.forEach(uph => {
							if (uph && uph.file_id && uph.width === 320) {
								console.log(`Avas of ${p.first_name}`, uph)
								ctx.telegram.sendPhoto(ch, uph.file_id, { caption: `Avas of ${p.first_name}` });
							}
						})
					}
				});
			})
		})
	} else {
		return loadPlayers(ctx, () => {
			showPhotos(ctx, next)
		})
	}
	if (next) return next()
	else return "ok"
}

function showPhotosOfUser(ctx, currentId, targetId) {
	ctx.telegram.getUserProfilePhotos(targetId, 0, 0).then((photo) => {
		if (photo && photo.photos) {
			photo.photos.forEach(arrayOfPhotos => {
				if (arrayOfPhotos && arrayOfPhotos.length > 0) {
					//console.log(`Avas of ${p.first_name}`, arph)
					arrayOfPhotos.forEach(uph => {
						if (uph && uph.file_id && uph.width === 160) {  // другие размеры 320 160 и 640
							//console.log(`Avas of ${p.first_name}`, uph)
							ctx.telegram.sendPhoto(currentId, uph.file_id, { caption: "Вот фото" });
						}
					})
				}
			});
		}
		return photo
	}).catch((error) => {
		logError(ctx, error)
		console.log('Error in showPhotosOfUser: ', error);
		throw error
	});
}
