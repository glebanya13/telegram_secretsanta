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

const restore_kb = Markup.inlineKeyboard(
	[
		Markup.callbackButton('Восстановить!', 'restoreMe')
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
	
	const altwelcom = `\nПривет, ${ctx.message.from.first_name} ${ctx.message.from.last_name}!`
		+ "\nЯ 👼 тайный сантабот!\n"
		+ "Игра началась. Присоединиться больше не возможно.\n"
		+ "Если ты уже в игре, нажми восстановить."

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
	//	ctx.replyWithHTML(welcomMsg, start_kb.extra())
	ctx.replyWithHTML(altwelcom, restore_kb.extra())

	loadPlayers(ctx)
})

bot.action('restoreMe', ctx => 
{
	let id = ctx.update.callback_query.from.id
	if(ctx.session.players && ctx.session.players.length > 0 && id && ctx.session.players.filter(p => p.id === id).length > 0){
		return ctx.reply("Пожалуйста!", start_kb.extra())
	}else{
		ctx.reply('Похоже 👼 уже совсем пожждно. Обратись к админу.')
	}
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
			ctx.telegram.sendMessage(ctx.message.from.id, "Итак, игра началась. Ты можешь вытянуть Имя! Готов?", target_kb.extra())
			//whoIsMyTarget(ctx)
			break;
		case 'Куда принести?':
			ctx.replyWithHTML("Принеси подарок в Параф.дом, <b>в Концилярию</b>. <b>Марина</b>, секретарь парафии, находится там <i>каждый день с 14 до 18</i>. Для уверенности, можно ей позвонить.")
			ctx.telegram.sendContact(ctx.message.from.id, "+375292748455", "Марина")
			ctx.replyWithHTML('Надо купить подарок (недорогой, допустим до 10 руб). Помни, важны не деньги, а кусочек любви. Будь креативен!')
			break;
		case 'Когда принести?':
			ctx.replyWithHTML('Надо купить подарок (недорогой, допустим до 10 руб). <i>Красиво</i> упаковать и <i>подписать</i>. \n<b>До 22 декабря</b> подарок должен быть готов.')
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
		default:
			//ctx.reply('Хорошего Тебе дня!')
			// {
			// 	if (ctx.message.from.id === 935549446) {
			// 		testGen(ctx, parseInt(ctx.message.text))
			// 	}
			// }
	}
	return next()
})

function testAll(ctx, next){
	return admin.firestore().collection('players').get()
	.then((snapshot) => {

		let all = [...snapshot.docs.map(d => d.data())]
		ctx.reply(`all count 3 ${all.length}`)
		all = shuffle(shuffle(all))
		
		all.forEach(a => generateForMe(ctx, a, all, next))
		
		//if (next) return next()
		//else
			return all
	})
	.catch(error => {
		logError(ctx, error)
		console.log('Error testAll: ', error)
	})
}

function testGen(ctx, id, next) {
	return admin.firestore().collection('players').get()
		.then((snapshot) => {

			let all = [...snapshot.docs.map(d => d.data())]
			ctx.reply(`all count 4 ${all.length}`)

			let me = all.find(a => a.id === id)
			generateForMe(ctx, me, all, next)
			if (next) return next()
			else
				return all
		})
		.catch(error => {
			logError(ctx, error)
			console.log('Error testGen: ', error)
		})
}

function reset(ctx, next) {
	return admin.firestore().collection('players').get()
		.then((snapshot) => {

			let all = [...snapshot.docs.map(d => d.data())]
			ctx.reply(`all count 5 ${all.length}`)

			//Get a new write batch
			const db = admin.firestore()
			const batch = db.batch();

			all.forEach(a => {
				let ref = db.collection('players').doc(a.id.toString());
				a.hassanta = false
				a.hastarget = false
				batch.set(ref, a);
			})

			// Commit the batch
			batch.commit().then(function (res) {
				console.log(res)
				ctx.reply('batch ok')
				return res
				//ctx.reply(res)
			}).catch(function(error){
				logError(error)
				throw error
			});
			return all
			// let part1 = []
			// for(var i = 0; i < 15;i++){
			// 	part1.push(all[i])
			// }
			// let part2 = []
			// for(var i = 15; i < 33;i++){
			// 	part2.push(all[i])
			// }

			// ctx.reply(part1)
			// ctx.reply(part2)

			//ctx.reply(all.map(a => `${a.first_name} ${a.last_name} ${a.id}\n`).join(''))
			// if (next) return next()
			// else
			// 	return all
		})
		.catch(error => {
			logError(ctx, error)
			console.log('Error reset: ', error)
		})
}

function updatePlayer(ctx, p) {
	return admin.firestore.collection('players').doc((p.id).toString()).set(p)
		.then(function (res) {
			console.log('updatePlayer Result for target', res)
			return res
			// if (next) {
			// 	return next()
			// } else return res
		})
		.catch(function (error) {
			logError(ctx, error)
			console.log('Error in updatePlayer for target: ', error);
		});
}


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
	//'572193621', // gleb
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

var data = require('./test');
bot.command('sendstart', (ctx, next) => {
	ctx.reply('min...')
	return admin.firestore().collection('players').get()
		.then((snapshot) => {
			let all = [...snapshot.docs.map(d => d.data())]
			ctx.reply(`all count 1 ${all.length}`)
			//let me = 935549446
			all.forEach(a => ctx.telegram.sendMessage(a.id, `Доброе утро, ${a.first_name}!\n Итак, перед тобой сантабот 👼🏻 2.0. \n Попробуем снова. Ты можешь вытянуть Имя! Готов?`, target_kb.extra()))
			//all.forEach(a => ctx.telegram.sendMessage(a, "Я так заигрался, что раздал слишком много имен. В итоге меня наказлаи=( и отправили на ремонт. Прошу прощения. Завтра переиграем."))

			//all.forEach(ch => 
			//	ctx.telegram.sendMessage(ch.id, "Итак, игра началась. Ты можешь вытянуть Имя! Готов?", target_kb.extra()))
			// if (next) return next()
			// else
				return all
		})
		.catch(error => {
			logError(ctx, error)
			console.log('Error sendstart: ', error)
		})
})

bot.command('res', (ctx, next) => {
	reset(ctx)
	if (next) return next()
})

bot.command('tm', (ctx, next) => {
	

testAll(ctx, next)

	//delete ctx.session.targets
	// let targets = ctx.session.targets ? ctx.session.targets : [...data.targets]
	//  if(!ctx.session.targets){
	// 	ctx.session.targets = targets
	//  }
	//ctx.telegram.sendContact(ctx.message.from.id, "+375292748455", "Марина")
	// let targets = [...data.targets]
	// targets = shuffle(targets) 
	// for(var i = 0; i < 27; i++){
	// 	generateForMe(ctx, targets[i], targets, next)
	// }

	//targets.forEach(tg => generateForMe(ctx, tg, targets, next))
	if (next) return next()
})

bot.command('sessio', ctx => ctx.session && ctx.session.targets && ctx.reply(ctx.session.targets.map(tg => `${tg.first_name}-${tg.hassanta === true}-${tg.hastarget === true}`)))

function generateForMe(ctx, me, targets, next) {

	if(!me)
	return;

	if (me.hastarget) {
		
		ctx.reply("По моим данным, ты уже получил инфу.")
		return;
	}

	// let me = {
	// 	"id": 935549446,
	// 	"last_name": "S",
	// 	"isParticipant": true,
	// 	"first_name": "Е"
	// }

	let resultTarget = {}
	let cand = me.id

	let possible = targets.filter(tg => tg.hassanta !== true)
	possible = possible.filter(pb => pb.id !== cand)

	//ctx.replyWithHTML(`Возможных <b>${possible.length}</b>`)
	console.log('possible length', possible.length)
	if (possible.length === 0) {
		lgme(ctx, "possible length === 0")
	}
	if (possible.length === 1) {
		if (possible[0].id === cand) {
			lgme(ctx, "the same target id possiblep[0].id === cand")
		} else {
			lgres(ctx, possible[0], me, next)
			setTargetChoosen(possible[0], me)
			resultTarget = possible[0]
		}
	}


	if (!resultTarget.id) {
		possible.push(me)
		// if(possible.length < 3)
		// lgme(ctx, `${me.first_name} ${me.id} -> ${JSON.stringify(possible)}`)

		possible.forEach(tg => {
			if (tg.except) {
				let variants = possible.filter(tv => tv.id !== tg.id && tv.id !== tg.except)
				console.log('possible with exept length', variants.length)
				if (variants.length === 2) {
					let myexept = possible.filter(v => v.id === tg.except)
					if (myexept.length > 0) {
						if (myexept[0].hastarget) {
							//noproblem
						} else {
							variants.forEach(v => v.reserved = [tg.id, tg.except])
						}
					}
				}
				if (variants.length === 1) {
					variants[0].reserved = [tg.id, tg.except]
				}
			} else {
				let variants = possible.filter(tv => tv.id !== tg.id)
				console.log('possible without exept length', variants.length)
				if (variants.length === 0) {
					lgme(ctx, "No possible let variants = possible.filter(tv => tv.id !== tg.id)")
				}
			}
		})
		
		possible = possible.filter(p => p.id !== cand)
		possible = possible.filter(p => !p.except || (p.except && p.except !== cand))

		let inclreserved = possible.filter(pb => !pb.reserved || (pb.reserved && (pb.reserved.length > 0) && pb.reserved.indexOf(cand) !== -1))

		console.log('inclreserved length', inclreserved.length)
		if (inclreserved.length === 0) {
			lgme(ctx, `all are reserved inclreserved.length === 0 ${cand}`)
			//lgme(ctx, `possible ${possible.map(p => JSON.stringify(p)).join(',')}`)
		} else {
			if (inclreserved.length === 1) {
				setTargetChoosen(inclreserved[0], me)
				lgres(ctx, inclreserved[0], me, next)
				resultTarget = inclreserved[0]
			} else {
				let chooseIndex = getRandomInt(0, inclreserved.length)

				setTargetChoosen(inclreserved[chooseIndex], me)
				lgres(ctx, inclreserved[chooseIndex], me, next)
				resultTarget = inclreserved[chooseIndex]
			}
		}
	}


	if (resultTarget && resultTarget.id) {
		return sendTargetInfo(ctx, resultTarget)
	}
	// if(ctx.session.players)
	// ctx.reply(ctx.session.players)
	//ctx.reply(ctx.session.players.map(w => `${w.first_name}_${w.last_name}_${w.username} ${w.id}\n`).join(' '))

	//ctx.reply('test 1')
	//if (next) return next()
}

function lgme(ctx, msg) {
	console.log(`lgme error^ ${msg}`)
	return adminList.forEach(a => ctx.telegram.sendMessage(a, `lgme error^ ${msg}`))
}

function lgres(ctx, target, me, next) {
//	if((me.except && me.except === target.id) || me.id === target.id)
	//return adminList.forEach(a => ctx.telegram.sendMessage(a, `Me: ${me.first_name}, Targ: ${target.first_name} - ${(me.except && me.except === target.id) || me.id === target.id ? "<b>bad</b>" : "ok"}`, 'HTML'))
	//if(next) return next()
}

function setTargetChoosen(target, me) {
	if(target.reserved){
		delete target.reserved
	}
	target.hassanta = true
	firestore.collection('players').doc((target.id).toString()).set(target)
		.then(function (res) {
			console.log('setTargetChoosen Result for target', res)
			return res
			// if (next) {
			// 	return next()
			// } else return res
		})
		.catch(function (error) {
			logError(ctx, error)
			console.log('Error in setTargetChoosen for target: ', error);
		});

	me.hastarget = true
	if(me.reserved){
		delete me.reserved
	}
	firestore.collection('players').doc((me.id).toString()).set(me)
		.then(function (res) {
			console.log('setTargetChoosen Result for me', res)
			return res
			// if (next) {
			// 	return next()
			// } else return res
		})
		.catch(function (error) {
			logError(ctx, error)
			console.log('Error in setTargetChoosen for me: ', error);
		});
	//todo 
	console.log(target)
}

function shuffle(array) {
	var currentIndex = array.length, temporaryValue, randomIndex;

	// While there remain elements to shuffle...
	while (0 !== currentIndex) {

		// Pick a remaining element...
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex -= 1;

		// And swap it with the current element.
		temporaryValue = array[currentIndex];
		array[currentIndex] = array[randomIndex];
		array[randomIndex] = temporaryValue;
	}

	return array;
}

const target_kb = Markup.inlineKeyboard(
	[
		Markup.callbackButton('Да! Супер!', 'getMyTarget')
	]
)

bot.action('getMyTarget', (ctx, next) => {
	let res1 = true
	//ctx.reply("Похоже я заболел... 😷 Меня счас подлечат, а наутро буду как огурчик. Все переиграем.")
	if (res1) {
		return admin.firestore().collection('players').get()
			.then((snapshot) => {
				let all = [...snapshot.docs.map(d => d.data())]
				let me = all.find(f => f.id === ctx.update.callback_query.from.id)
				ctx.reply(`Всего в игре ${all.length}. Работаю... Может занять некоторе время...`)

				generateForMe(ctx, me, all, next)

				if (next) return next()
				else
					return all
			})
			.catch(error => {
				logError(ctx, error)
				console.log('Error loadPlayers: ', error)
			})
	}


	//console.log(ctx)
	//return ctx.reply(ctx.update.callback_query.from)
	//if(next) return next()
})

bot.command('/gettarget', (ctx, next) => {
	traceChatList.forEach(ch => ctx.telegram.sendMessage(ch, "Итак, игра началась. Ты можешь вытянуть Имя! Готов?", target_kb.extra()))

	if (next) return next()
})

bot.command('/gs', (ctx, next) => {
	return admin.firestore().collection('players').get()
		.then((snapshot) => {
			let all = [...snapshot.docs.map(d => d.data())]
			ctx.reply(`all count 2 ${all.length}`)
			ctx.reply(`no santa ${all.filter(a => !a.hassanta).map(am => am.first_name).join(' ')}`)

			ctx.reply(`no target ${all.filter(a => !a.hastarget).map(am => am.first_name + am.last_name).join(' ')}`)
			//let me = 935549446
			//all.forEach(a => ctx.telegram.sendMessage(a, "Итак, игра началась. Ты можешь вытянуть Имя! Готов?", target_kb.extra()))

			//all.forEach(ch => 
			//	ctx.telegram.sendMessage(ch.id, "Итак, игра началась. Ты можешь вытянуть Имя! Готов?", target_kb.extra()))
			if (next) return next()
			else
				return all
		})
		.catch(error => {
			logError(ctx, error)
			console.log('Error sendstart: ', error)
		})

})

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


//bot.launch();

 bot.telegram.setWebhook(`https://us-central1-secretsanta-234fc.cloudfunctions.net/stanta`);

 exports.stanta = functions.https.onRequest(
 	(req, res) => bot.handleUpdate(req.body, res)
 )

// https://api.telegram.org/bot1493834992:AAFQetYA4bgRS_frO1glgBIoSyZXTRuRywQ/getMe
// https://api.telegram.org/bot1493834992:AAFQetYA4bgRS_frO1glgBIoSyZXTRuRywQ/setWebhook?url=https://us-central1-secretsanta-234fc.cloudfunctions.net/stanta
// https://api.telegram.org/bot1493834992:AAFQetYA4bgRS_frO1glgBIoSyZXTRuRywQ/getWebhookInfo


// bot.launch({
// 	webhook: {
// 	  domain: 'https://us-central1-secretsanta-234fc.cloudfunctions.net/stanta'
// 	}
//   })



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
			sendTargetInfo(ctx, target)
		} else {
			ctx.reply('Пока не знаю. Игра еще не началась. Подождем всех...')
		}
	} else {
		ctx.reply("Таак... под рукой списка нет. Счас сбегаю в базу...")
		loadPlayers(ctx, () => whoIsMyTarget(ctx))
		//findTargetPlayer(ctx.message.from.id.toString())
	}
}

const genres_kb = Markup.inlineKeyboard(
	[
		Markup.callbackButton('Да, отлично!', 'genOk'),
		Markup.callbackButton('Ошибка!', 'genError')
	]
)

bot.action('genError', ctx => {
	ctx.reply('Понял. Админ скоро свяжется с тобой.')
	let from = ctx.update.callback_query.from
	traceChatList.forEach(ch =>
		ctx.telegram.sendMessage(ch,
			`${from.id}|${from.username}|${from.first_name}_${from.last_name} gen error`
		)
	)
})

bot.action('genOk', ctx => {
	ctx.reply("Супер! Теперь приготовь подарок. Помни главное не цена, кусочек любви! \n> Упокуй. \n> Напиши имя\n> Если ты очень добр, напиши задание, которое надо сделать чтобы получить подарок: например спеть, станцевать, или чтото еще!")
	let from = ctx.update.callback_query.from
	traceChatList.forEach(ch =>
		ctx.telegram.sendMessage(ch,
			`${from.id}|${from.username}|${from.first_name}_${from.last_name} gen ok`
		)
	)
})

function sendTargetInfo(ctx, target) {
	if (target && target.id) {
		let fname = typeof target.first_name !== "undefined" ? target.first_name : ''
		let lname = typeof target.last_name !== "undefined" ? target.last_name : ''
		let username = typeof target.username !== "undefined" ? target.username : ''

		ctx.reply(`Тссс... Его зовут: ${fname} ${lname} | ${username} \nТолько никому не говори! Запомни хорошенько. Ведь я тоже забуду. Если ты получил себя, либо два имени либо чтото еще странное, нажми кнопку ошибка. Все хорошо?`, genres_kb.extra())
		ctx.reply('Хмм... И где-то было фото... Если найду, пришлю.')

		let from = ctx.update.callback_query
			? ctx.update.callback_query.from
			: ctx.message.from

		showPhotosOfUser(ctx, from.id, target.id) // 
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
		// traceChatList.forEach(ch =>
		// 	ctx.telegram.sendMessage(ch,
		// 		`Just info: ${ctx.message.from.id}|${ctx.message.from.username}|${ctx.message.from.first_name}_${ctx.message.from.last_name} sent ${ctx.message.text}`
		// 	)
		// )
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
							if (uph && uph.file_id && uph.width === 320) 
							{
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
					let fid = ''
					arrayOfPhotos.forEach(uph => {
						if (uph && uph.file_id && uph.width === 160) {  // другие размеры 320 160 и 640
							//console.log(`Avas of ${p.first_name}`, uph)
							fid = uph.file_id
						}
					})
					if (fid)
						ctx.telegram.sendPhoto(currentId, fid, { caption: "Вот фото" });
					else {
						arrayOfPhotos.forEach(uph => {
							if (uph && uph.file_id && uph.width === 320) {  // другие размеры 320 160 и 640
								//console.log(`Avas of ${p.first_name}`, uph)
								fid = uph.file_id
							}
						})
						if (fid)
							ctx.telegram.sendPhoto(currentId, fid, { caption: "Вот фото" });
						else {
							arrayOfPhotos.forEach(uph => {
								if (uph && uph.file_id && uph.width === 640) {  // другие размеры 320 160 и 640
									//console.log(`Avas of ${p.first_name}`, uph)
									fid = uph.file_id
								}
							})
							if (fid)
								ctx.telegram.sendPhoto(currentId, fid, { caption: "Вот фото" });
						}
					}

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
